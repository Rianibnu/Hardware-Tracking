<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Ticket;
use App\Models\ServiceRecord;
use App\Models\GoogleSheetConfig;
use App\Models\GoogleSheetSyncLog;
use Google\Client as GoogleClient;
use Google\Service\Sheets as GoogleSheets;
use Google\Service\Sheets\ValueRange;
use Google\Service\Sheets\BatchUpdateSpreadsheetRequest;
use Google\Service\Sheets\Request as SheetRequest;
use Google\Service\Sheets\SheetProperties;
use Google\Service\Sheets\AddSheetRequest;
use Illuminate\Support\Facades\Log;

class GoogleSheetsService
{
    protected ?GoogleClient $client = null;
    protected ?GoogleSheets $sheetsService = null;

    /**
     * Check if credentials file exists
     */
    public function hasCredentials(): bool
    {
        $path = config('google.sheets.credentials_path');
        return $path && file_exists($path);
    }

    /**
     * Initialize the Google Client
     */
    protected function getClient(): GoogleClient
    {
        if ($this->client) {
            return $this->client;
        }

        $this->client = new GoogleClient();
        $this->client->setApplicationName(config('google.sheets.application_name', 'Monitoring Inventaris'));
        $this->client->setScopes([GoogleSheets::SPREADSHEETS]);
        $this->client->setAuthConfig(config('google.sheets.credentials_path'));

        // Disable SSL verification for local development due to cURL error 77 (cacert.pem issue)
        if (config('app.env') === 'local') {
            $httpClient = new \GuzzleHttp\Client(['verify' => false]);
            $this->client->setHttpClient($httpClient);
        }

        return $this->client;
    }

    /**
     * Get the Sheets service
     */
    protected function getSheetsService(): GoogleSheets
    {
        if ($this->sheetsService) {
            return $this->sheetsService;
        }

        $this->sheetsService = new GoogleSheets($this->getClient());
        return $this->sheetsService;
    }

    /**
     * Test connection to a spreadsheet
     */
    public function testConnection(string $spreadsheetId): array
    {
        try {
            $service = $this->getSheetsService();
            $spreadsheet = $service->spreadsheets->get($spreadsheetId);

            return [
                'success' => true,
                'title' => $spreadsheet->getProperties()->getTitle(),
                'sheets' => collect($spreadsheet->getSheets())->map(fn ($s) => $s->getProperties()->getTitle())->toArray(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $this->parseGoogleError($e),
            ];
        }
    }

    /**
     * Perform a full sync for a given config
     */
    public function sync(GoogleSheetConfig $config, string $type = 'manual', ?int $userId = null): GoogleSheetSyncLog
    {
        $startTime = now();

        $log = GoogleSheetSyncLog::create([
            'config_id' => $config->id,
            'type' => $type,
            'status' => 'running',
            'triggered_by' => $userId,
        ]);

        try {
            $service = $this->getSheetsService();
            $spreadsheetId = $config->spreadsheet_id;
            $syncSheets = $config->sync_sheets ?? ['assets', 'tickets'];
            $totalRows = 0;

            // Get existing sheets in the spreadsheet
            $spreadsheet = $service->spreadsheets->get($spreadsheetId);
            $existingSheets = collect($spreadsheet->getSheets())
                ->map(fn ($s) => $s->getProperties()->getTitle())
                ->toArray();

            foreach ($syncSheets as $sheetType) {
                $sheetName = $this->getSheetName($sheetType);

                // Create sheet if it doesn't exist
                if (!in_array($sheetName, $existingSheets)) {
                    $this->createSheet($service, $spreadsheetId, $sheetName);
                }

                // Get data and write to sheet
                $data = $this->getDataForSheet($sheetType);
                $this->writeToSheet($service, $spreadsheetId, $sheetName, $data);
                $totalRows += count($data) - 1; // -1 for header
            }

            $duration = now()->diffInSeconds($startTime);

            $log->update([
                'status' => 'success',
                'sheets_synced' => $syncSheets,
                'total_rows' => $totalRows,
                'duration_seconds' => $duration,
            ]);

            $config->update([
                'status' => 'active',
                'last_synced_at' => now(),
                'last_sync_rows' => $totalRows,
                'last_error' => null,
            ]);

            return $log;
        } catch (\Exception $e) {
            $errorMsg = $this->parseGoogleError($e);
            $duration = now()->diffInSeconds($startTime);

            $log->update([
                'status' => 'failed',
                'error_message' => $errorMsg,
                'duration_seconds' => $duration,
            ]);

            $config->update([
                'status' => 'error',
                'last_error' => $errorMsg,
            ]);

            Log::error('Google Sheets sync failed', [
                'config_id' => $config->id,
                'error' => $errorMsg,
            ]);

            return $log;
        }
    }

    /**
     * Get sheet tab name for a data type
     */
    protected function getSheetName(string $type): string
    {
        return match ($type) {
            'assets' => 'Inventaris Asset',
            'tickets' => 'Laporan Kerusakan',
            'services' => 'Servis Pihak 3',
            'summary' => 'Ringkasan',
            default => ucfirst($type),
        };
    }

    /**
     * Create a new sheet tab in a spreadsheet
     */
    protected function createSheet(GoogleSheets $service, string $spreadsheetId, string $sheetName): void
    {
        $request = new BatchUpdateSpreadsheetRequest([
            'requests' => [
                new SheetRequest([
                    'addSheet' => new AddSheetRequest([
                        'properties' => new SheetProperties([
                            'title' => $sheetName,
                        ]),
                    ]),
                ]),
            ],
        ]);

        $service->spreadsheets->batchUpdate($spreadsheetId, $request);
    }

    /**
     * Write data to a specific sheet
     */
    protected function writeToSheet(GoogleSheets $service, string $spreadsheetId, string $sheetName, array $data): void
    {
        // Clear existing data first
        $range = "{$sheetName}!A1:Z";
        try {
            $service->spreadsheets_values->clear($spreadsheetId, $range, new \Google\Service\Sheets\ClearValuesRequest());
        } catch (\Exception $e) {
            // Sheet might be new/empty, that's fine
        }

        // Write new data
        $body = new ValueRange([
            'values' => $data,
        ]);

        $params = [
            'valueInputOption' => 'USER_ENTERED',
        ];

        $service->spreadsheets_values->update(
            $spreadsheetId,
            "{$sheetName}!A1",
            $body,
            $params
        );

        // Format header row (bold, colored background)
        $this->formatHeaderRow($service, $spreadsheetId, $sheetName);
    }

    /**
     * Format header row with styling
     */
    protected function formatHeaderRow(GoogleSheets $service, string $spreadsheetId, string $sheetName): void
    {
        try {
            // Get the sheet ID
            $spreadsheet = $service->spreadsheets->get($spreadsheetId);
            $sheetId = null;
            foreach ($spreadsheet->getSheets() as $sheet) {
                if ($sheet->getProperties()->getTitle() === $sheetName) {
                    $sheetId = $sheet->getProperties()->getSheetId();
                    break;
                }
            }

            if ($sheetId === null) return;

            $requests = [
                // Bold header
                new SheetRequest([
                    'repeatCell' => [
                        'range' => [
                            'sheetId' => $sheetId,
                            'startRowIndex' => 0,
                            'endRowIndex' => 1,
                        ],
                        'cell' => [
                            'userEnteredFormat' => [
                                'textFormat' => ['bold' => true],
                                'backgroundColor' => [
                                    'red' => 0.145,
                                    'green' => 0.388,
                                    'blue' => 0.922,
                                ],
                                'textFormat' => [
                                    'bold' => true,
                                    'foregroundColor' => [
                                        'red' => 1,
                                        'green' => 1,
                                        'blue' => 1,
                                    ],
                                ],
                            ],
                        ],
                        'fields' => 'userEnteredFormat(backgroundColor,textFormat)',
                    ],
                ]),
                // Freeze header row
                new SheetRequest([
                    'updateSheetProperties' => [
                        'properties' => [
                            'sheetId' => $sheetId,
                            'gridProperties' => [
                                'frozenRowCount' => 1,
                            ],
                        ],
                        'fields' => 'gridProperties.frozenRowCount',
                    ],
                ]),
                // Auto-resize columns
                new SheetRequest([
                    'autoResizeDimensions' => [
                        'dimensions' => [
                            'sheetId' => $sheetId,
                            'dimension' => 'COLUMNS',
                            'startIndex' => 0,
                            'endIndex' => 20,
                        ],
                    ],
                ]),
            ];

            $batchRequest = new BatchUpdateSpreadsheetRequest(['requests' => $requests]);
            $service->spreadsheets->batchUpdate($spreadsheetId, $batchRequest);
        } catch (\Exception $e) {
            // Formatting is non-critical, log but don't fail
            Log::warning('Failed to format header row', ['sheet' => $sheetName, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get data array for a specific sheet type
     */
    protected function getDataForSheet(string $type): array
    {
        return match ($type) {
            'assets' => $this->getAssetsData(),
            'tickets' => $this->getTicketsData(),
            'services' => $this->getServicesData(),
            'summary' => $this->getSummaryData(),
            default => [['Tidak ada data']],
        };
    }

    /**
     * Get assets data as 2D array
     */
    protected function getAssetsData(): array
    {
        $headers = [
            'Kode', 'Nama Asset', 'Kategori', 'Merek', 'Model',
            'Serial Number', 'Tahun Beli', 'Lokasi', 'Status',
            'Catatan', 'Dibuat', 'Terakhir Update',
        ];

        $statusMap = [
            'available' => 'Tersedia',
            'in_use' => 'Digunakan',
            'maintenance' => 'Maintenance',
            'broken' => 'Rusak',
            'disposed' => 'Dibuang',
        ];

        $assets = Asset::with(['category', 'brand', 'location'])
            ->orderBy('code')
            ->get();

        $rows = [$headers];

        foreach ($assets as $asset) {
            $rows[] = [
                $asset->code,
                $asset->name,
                $asset->category?->name ?? '-',
                $asset->brand?->name ?? '-',
                $asset->model ?? '-',
                $asset->serial_number ?? '-',
                $asset->purchase_year ?? '-',
                $asset->location?->name ?? '-',
                $statusMap[$asset->status] ?? $asset->status,
                $asset->notes ?? '',
                $asset->created_at?->format('d/m/Y H:i') ?? '-',
                $asset->updated_at?->format('d/m/Y H:i') ?? '-',
            ];
        }

        return $rows;
    }

    /**
     * Get tickets data as 2D array
     */
    protected function getTicketsData(): array
    {
        $headers = [
            'ID', 'Judul', 'Deskripsi', 'Asset', 'Kode Asset',
            'Pelapor', 'Teknisi', 'Status', 'Prioritas',
            'Tanggal Lapor', 'Tanggal Selesai',
        ];

        $statusMap = [
            'open' => 'Terbuka',
            'progress' => 'Dikerjakan',
            'done' => 'Selesai',
            'closed' => 'Ditutup',
        ];

        $priorityMap = [
            'low' => 'Rendah',
            'medium' => 'Sedang',
            'high' => 'Tinggi',
        ];

        $tickets = Ticket::with(['asset', 'reporter', 'assignee'])
            ->orderByDesc('created_at')
            ->get();

        $rows = [$headers];

        foreach ($tickets as $ticket) {
            $rows[] = [
                $ticket->id,
                $ticket->title,
                $ticket->description,
                $ticket->asset?->name ?? '-',
                $ticket->asset?->code ?? '-',
                $ticket->reporter?->name ?? ($ticket->reporter_name ?? 'Anonim'),
                $ticket->assignee?->name ?? 'Belum ditugaskan',
                $statusMap[$ticket->status] ?? $ticket->status,
                $priorityMap[$ticket->priority] ?? $ticket->priority,
                $ticket->created_at?->format('d/m/Y H:i') ?? '-',
                $ticket->resolved_at?->format('d/m/Y H:i') ?? '-',
            ];
        }

        return $rows;
    }

    /**
     * Get service records data as 2D array
     */
    protected function getServicesData(): array
    {
        $headers = [
            'ID', 'Asset', 'Kode Asset', 'Vendor', 'Deskripsi Servis',
            'Biaya', 'Status', 'Dibuat Oleh', 'Estimasi Selesai',
            'Tanggal Selesai', 'Diselesaikan Oleh',
        ];

        $statusMap = [
            'in_progress' => 'Dikerjakan',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
        ];

        $records = ServiceRecord::with(['asset', 'creator', 'completer'])
            ->orderByDesc('created_at')
            ->get();

        $rows = [$headers];

        foreach ($records as $record) {
            $rows[] = [
                $record->id,
                $record->asset?->name ?? '-',
                $record->asset?->code ?? '-',
                $record->vendor_name,
                $record->service_description,
                $record->cost ? 'Rp ' . number_format($record->cost, 0, ',', '.') : '-',
                $statusMap[$record->status] ?? $record->status,
                $record->creator?->name ?? '-',
                $record->estimated_completion_date ?? '-',
                $record->completed_at ? date('d/m/Y H:i', strtotime($record->completed_at)) : '-',
                $record->completer?->name ?? '-',
            ];
        }

        return $rows;
    }

    /**
     * Get summary/dashboard data
     */
    protected function getSummaryData(): array
    {
        $rows = [
            ['RINGKASAN MONITORING INVENTARIS', '', '', ''],
            ['Terakhir diperbarui:', now()->format('d/m/Y H:i:s'), '', ''],
            ['', '', '', ''],
            ['=== STATUS ASSET ===', '', '', ''],
            ['Total Asset', Asset::count(), '', ''],
            ['Tersedia', Asset::where('status', 'available')->count(), '', ''],
            ['Digunakan', Asset::where('status', 'in_use')->count(), '', ''],
            ['Maintenance', Asset::where('status', 'maintenance')->count(), '', ''],
            ['Rusak', Asset::where('status', 'broken')->count(), '', ''],
            ['Dibuang', Asset::where('status', 'disposed')->count(), '', ''],
            ['', '', '', ''],
            ['=== STATUS TICKET ===', '', '', ''],
            ['Total Ticket', Ticket::count(), '', ''],
            ['Terbuka', Ticket::where('status', 'open')->count(), '', ''],
            ['Dikerjakan', Ticket::where('status', 'progress')->count(), '', ''],
            ['Selesai', Ticket::where('status', 'done')->count(), '', ''],
            ['Ditutup', Ticket::where('status', 'closed')->count(), '', ''],
            ['', '', '', ''],
            ['=== SERVIS PIHAK 3 ===', '', '', ''],
            ['Total Servis', ServiceRecord::count(), '', ''],
            ['Dikerjakan', ServiceRecord::where('status', 'in_progress')->count(), '', ''],
            ['Selesai', ServiceRecord::where('status', 'completed')->count(), '', ''],
        ];

        return $rows;
    }

    /**
     * Parse Google API errors into readable messages
     */
    protected function parseGoogleError(\Exception $e): string
    {
        $message = $e->getMessage();

        if (str_contains($message, 'not found')) {
            return 'Spreadsheet tidak ditemukan. Pastikan ID/URL benar dan spreadsheet sudah di-share ke service account.';
        }
        if (str_contains($message, 'permission') || str_contains($message, 'forbidden') || str_contains($message, '403')) {
            return 'Tidak punya akses ke spreadsheet. Pastikan spreadsheet sudah di-share ke email service account dengan permission "Editor".';
        }
        if (str_contains($message, 'credentials') || str_contains($message, 'auth')) {
            return 'Gagal autentikasi. Pastikan file credentials.json sudah benar dan service account aktif.';
        }
        if (str_contains($message, 'INVALID_ARGUMENT')) {
            return 'Parameter tidak valid. Periksa kembali Spreadsheet ID.';
        }

        return 'Error: ' . $message;
    }
}

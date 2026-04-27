<?php

namespace App\Http\Controllers;

use App\Models\GoogleSheetConfig;
use App\Models\GoogleSheetSyncLog;
use App\Services\GoogleSheetsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GoogleSheetsController extends Controller
{
    public function __construct(
        protected GoogleSheetsService $sheetsService
    ) {}

    /**
     * Main page — show all configs + sync history
     */
    public function index()
    {
        $configs = GoogleSheetConfig::with('creator')
            ->latest()
            ->get();

        $recentLogs = GoogleSheetSyncLog::with(['config', 'triggeredBy'])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('google-sheets/index', [
            'configs' => $configs,
            'recentLogs' => $recentLogs,
            'hasCredentials' => $this->sheetsService->hasCredentials(),
            'credentialsPath' => config('google.sheets.credentials_path'),
        ]);
    }

    /**
     * Store a new sync configuration
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'spreadsheet_url' => 'required|string',
            'sync_sheets' => 'required|array|min:1',
            'sync_sheets.*' => 'in:assets,tickets,services,summary',
            'auto_sync' => 'boolean',
            'sync_interval_minutes' => 'integer|min:5|max:1440',
        ]);

        $spreadsheetId = GoogleSheetConfig::extractSpreadsheetId($request->spreadsheet_url);

        if (!$spreadsheetId) {
            return back()->with('error', 'URL/ID Spreadsheet tidak valid. Pastikan menggunakan URL Google Sheets yang benar.');
        }

        // Test connection first
        if (!$this->sheetsService->hasCredentials()) {
            return back()->with('error', 'File credentials.json belum dikonfigurasi. Upload file credentials ke: ' . config('google.sheets.credentials_path'));
        }

        $result = $this->sheetsService->testConnection($spreadsheetId);

        if (!$result['success']) {
            return back()->with('error', $result['error']);
        }

        $config = GoogleSheetConfig::create([
            'name' => $request->name,
            'spreadsheet_id' => $spreadsheetId,
            'spreadsheet_url' => "https://docs.google.com/spreadsheets/d/{$spreadsheetId}",
            'sync_sheets' => $request->sync_sheets,
            'auto_sync' => $request->boolean('auto_sync', false),
            'sync_interval_minutes' => $request->sync_interval_minutes ?? 30,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', "Konfigurasi \"{$config->name}\" berhasil dibuat! Spreadsheet: {$result['title']}");
    }

    /**
     * Update a sync configuration
     */
    public function update(Request $request, GoogleSheetConfig $googleSheetConfig)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sync_sheets' => 'required|array|min:1',
            'sync_sheets.*' => 'in:assets,tickets,services,summary',
            'auto_sync' => 'boolean',
            'sync_interval_minutes' => 'integer|min:5|max:1440',
        ]);

        $googleSheetConfig->update([
            'name' => $request->name,
            'sync_sheets' => $request->sync_sheets,
            'auto_sync' => $request->boolean('auto_sync', false),
            'sync_interval_minutes' => $request->sync_interval_minutes ?? 30,
        ]);

        return back()->with('success', "Konfigurasi \"{$googleSheetConfig->name}\" berhasil diperbarui.");
    }

    /**
     * Delete a sync configuration
     */
    public function destroy(GoogleSheetConfig $googleSheetConfig)
    {
        $name = $googleSheetConfig->name;
        $googleSheetConfig->delete();

        return back()->with('success', "Konfigurasi \"{$name}\" berhasil dihapus.");
    }

    /**
     * Trigger manual sync
     */
    public function sync(GoogleSheetConfig $googleSheetConfig)
    {
        if (!$this->sheetsService->hasCredentials()) {
            return back()->with('error', 'File credentials.json belum dikonfigurasi.');
        }

        $log = $this->sheetsService->sync($googleSheetConfig, 'manual', auth()->id());

        if ($log->status === 'success') {
            return back()->with('success', "Sync berhasil! {$log->total_rows} baris data telah disinkronkan ke Google Sheets dalam {$log->duration_seconds} detik.");
        }

        return back()->with('error', "Sync gagal: {$log->error_message}");
    }

    /**
     * Test connection to a spreadsheet
     */
    public function testConnection(Request $request)
    {
        $request->validate([
            'spreadsheet_url' => 'required|string',
        ]);

        if (!$this->sheetsService->hasCredentials()) {
            return response()->json([
                'success' => false,
                'error' => 'File credentials.json belum dikonfigurasi.',
            ]);
        }

        $spreadsheetId = GoogleSheetConfig::extractSpreadsheetId($request->spreadsheet_url);

        if (!$spreadsheetId) {
            return response()->json([
                'success' => false,
                'error' => 'URL/ID Spreadsheet tidak valid.',
            ]);
        }

        $result = $this->sheetsService->testConnection($spreadsheetId);
        return response()->json($result);
    }

    /**
     * Toggle auto sync on/off
     */
    public function toggleAutoSync(GoogleSheetConfig $googleSheetConfig)
    {
        $googleSheetConfig->update([
            'auto_sync' => !$googleSheetConfig->auto_sync,
        ]);

        $status = $googleSheetConfig->auto_sync ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Auto-sync untuk \"{$googleSheetConfig->name}\" telah {$status}.");
    }

    /**
     * Upload credentials file
     */
    public function uploadCredentials(Request $request)
    {
        $request->validate([
            'credentials' => 'required|file|mimetypes:application/json,text/plain|max:1024',
        ]);

        $path = config('google.sheets.credentials_path');
        $dir = dirname($path);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $request->file('credentials')->move($dir, basename($path));

        // Validate the file contents
        $content = json_decode(file_get_contents($path), true);
        if (!$content || !isset($content['type'])) {
            @unlink($path);
            return back()->with('error', 'File credentials tidak valid. Pastikan menggunakan file JSON dari Google Cloud Console.');
        }

        $email = $content['client_email'] ?? 'unknown';

        return back()->with('success', "Credentials berhasil diupload! Service Account email: {$email}. Pastikan email ini sudah di-share ke spreadsheet Anda.");
    }
}

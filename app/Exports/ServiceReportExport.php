<?php

namespace App\Exports;

use App\Models\ServiceRecord;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ServiceReportExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = ServiceRecord::with(['asset.category', 'creator', 'completer'])->latest();

        if (!empty($this->filters['start_date'])) {
            $query->whereDate('created_at', '>=', $this->filters['start_date']);
        }
        if (!empty($this->filters['end_date'])) {
            $query->whereDate('created_at', '<=', $this->filters['end_date']);
        }
        if (!empty($this->filters['technician_id'])) {
            $query->where('created_by', $this->filters['technician_id']);
        }
        if (!empty($this->filters['category_id'])) {
            $query->whereHas('asset', fn($q) => $q->where('category_id', $this->filters['category_id']));
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Asset',
            'Kategori',
            'Vendor / Pihak Ketiga',
            'Deskripsi Pekerjaan',
            'Estimasi Selesai',
            'Biaya (Rp)',
            'Status',
            'Dibuat Oleh',
            'Diselesaikan Oleh',
            'Tanggal Selesai',
        ];
    }

    public function map($record): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $record->created_at->format('d/m/Y H:i'),
            $record->asset?->name ?? '-',
            $record->asset?->category?->name ?? '-',
            $record->vendor_name,
            $record->service_description,
            $record->estimated_completion_date?->format('d/m/Y') ?? '-',
            number_format($record->cost, 0, ',', '.'),
            ucfirst($record->status),
            $record->creator?->name ?? '-',
            $record->completer?->name ?? '-',
            $record->completed_at?->format('d/m/Y H:i') ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '7C3AED'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Laporan Service Pihak Ketiga';
    }
}

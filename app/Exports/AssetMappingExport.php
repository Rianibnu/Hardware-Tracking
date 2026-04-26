<?php

namespace App\Exports;

use App\Models\Asset;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AssetMappingExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Asset::with(['category', 'location', 'brand'])
            ->withCount('tickets')
            ->latest();

        if (!empty($this->filters['category_id'])) {
            $query->where('category_id', $this->filters['category_id']);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode Asset',
            'Nama Asset',
            'Kategori',
            'Merek',
            'Model',
            'Serial Number',
            'Tahun Beli',
            'Lokasi',
            'Status',
            'Jumlah Tiket',
            'Catatan',
        ];
    }

    public function map($asset): array
    {
        static $no = 0;
        $no++;

        $statusLabels = [
            'available'   => 'Tersedia',
            'in_use'      => 'Digunakan',
            'maintenance' => 'Maintenance',
            'broken'      => 'Rusak',
            'disposed'    => 'Dibuang',
        ];

        return [
            $no,
            $asset->code,
            $asset->name,
            $asset->category?->name ?? '-',
            $asset->brand?->name ?? '-',
            $asset->model ?? '-',
            $asset->serial_number ?? '-',
            $asset->purchase_year ?? '-',
            $asset->location?->name ?? '-',
            $statusLabels[$asset->status] ?? ucfirst($asset->status),
            $asset->tickets_count,
            $asset->notes ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '059669'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Mapping Asset';
    }
}

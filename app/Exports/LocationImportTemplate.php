<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class LocationImportTemplate implements FromArray, WithHeadings, WithStyles, WithTitle, ShouldAutoSize
{
    public function headings(): array
    {
        return [
            'nama_lokasi',
            'gedung',
            'lantai',
            'ruangan',
            'keterangan',
        ];
    }

    public function array(): array
    {
        return [
            [
                'Ruang Server 1',
                'Gedung A',
                'Lt. 2',
                'R-201',
                'Ruangan utama server dan jaringan',
            ],
            [
                'Ruang Admin',
                'Gedung A',
                'Lt. 1',
                'R-101',
                'Ruangan administrasi umum',
            ],
            [
                'Gudang IT',
                'Gedung B',
                'Lt. 1',
                '',
                'Penyimpanan perangkat cadangan',
            ],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Header style
        $sheet->getStyle('A1:E1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2563EB'],
            ],
        ]);

        // Sample data style
        $sheet->getStyle('A2:E4')->applyFromArray([
            'font' => ['italic' => true, 'color' => ['rgb' => '6B7280']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F3F4F6'],
            ],
        ]);

        // Comments / hints
        $sheet->getComment('A1')->getText()->createTextRun("WAJIB. Nama lokasi harus unik.");
        $sheet->getComment('B1')->getText()->createTextRun("Opsional. Nama gedung.");
        $sheet->getComment('C1')->getText()->createTextRun("Opsional. Lantai lokasi.");
        $sheet->getComment('D1')->getText()->createTextRun("Opsional. Nomor atau nama ruangan.");
        $sheet->getComment('E1')->getText()->createTextRun("Opsional. Keterangan tambahan tentang lokasi.");

        return [];
    }

    public function title(): string
    {
        return 'Template Lokasi';
    }
}

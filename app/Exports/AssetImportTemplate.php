<?php

namespace App\Exports;

use App\Models\Category;
use App\Models\Location;
use App\Models\Brand;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class AssetImportTemplate implements FromArray, WithHeadings, WithStyles, WithTitle, ShouldAutoSize, WithEvents
{
    protected array $categories;
    protected array $locations;
    protected array $brands;

    public function __construct()
    {
        $this->categories = Category::orderBy('name')->pluck('name')->toArray();
        $this->locations  = Location::orderBy('name')->pluck('name')->toArray();
        $this->brands     = Brand::orderBy('name')->pluck('name')->toArray();
    }

    public function headings(): array
    {
        return [
            'kode_asset',
            'nama_asset',
            'kategori',
            'merek',
            'model',
            'serial_number',
            'tahun_beli',
            'lokasi',
            'status',
            'catatan',
        ];
    }

    public function array(): array
    {
        return [
            [
                'AST-001',
                'Laptop Dell Latitude 5540',
                $this->categories[0] ?? 'Laptop',
                $this->brands[0] ?? 'Dell',
                'Latitude 5540',
                'SN-ABC123',
                2024,
                $this->locations[0] ?? 'Ruang IT Lt.2',
                'Tersedia',
                'Kondisi baik',
            ],
            [
                'AST-002',
                'Printer HP LaserJet Pro',
                $this->categories[1] ?? 'Printer',
                $this->brands[1] ?? 'HP',
                'LaserJet Pro M404dn',
                'SN-XYZ789',
                2023,
                $this->locations[1] ?? 'Ruang Admin Lt.1',
                'Digunakan',
                '',
            ],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Header style
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2563EB'],
            ],
        ]);

        // Contoh data style
        $sheet->getStyle('A2:J3')->applyFromArray([
            'font' => ['italic' => true, 'color' => ['rgb' => '6B7280']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F3F4F6'],
            ],
        ]);

        // Komentar petunjuk
        $sheet->getComment('A1')->getText()->createTextRun("Opsional. Kosongkan untuk auto-generate kode.");
        $sheet->getComment('B1')->getText()->createTextRun("WAJIB. Nama asset.");
        $sheet->getComment('C1')->getText()->createTextRun("WAJIB. Pilih dari dropdown atau ketik baru (otomatis dibuat).");
        $sheet->getComment('D1')->getText()->createTextRun("Opsional. Pilih dari dropdown atau ketik baru.");
        $sheet->getComment('H1')->getText()->createTextRun("WAJIB. Pilih dari dropdown atau ketik baru (otomatis dibuat).");
        $sheet->getComment('I1')->getText()->createTextRun("Pilih: Tersedia, Digunakan, Maintenance, Rusak, Dibuang");

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $maxRow = 500; // dropdown berlaku untuk 500 baris ke depan

                // ========== Sheet "Master Data" (tersembunyi) ==========
                $spreadsheet = $sheet->getParent();
                $refSheet = $spreadsheet->createSheet();
                $refSheet->setTitle('_MasterData');

                // Tulis data Kategori ke kolom A
                $refSheet->setCellValue('A1', 'Kategori');
                foreach ($this->categories as $i => $cat) {
                    $refSheet->setCellValue('A' . ($i + 2), $cat);
                }

                // Tulis data Lokasi ke kolom B
                $refSheet->setCellValue('B1', 'Lokasi');
                foreach ($this->locations as $i => $loc) {
                    $refSheet->setCellValue('B' . ($i + 2), $loc);
                }

                // Tulis data Merek ke kolom C
                $refSheet->setCellValue('C1', 'Merek');
                foreach ($this->brands as $i => $brand) {
                    $refSheet->setCellValue('C' . ($i + 2), $brand);
                }

                // Tulis data Status ke kolom D
                $statuses = ['Tersedia', 'Digunakan', 'Maintenance', 'Rusak', 'Dibuang'];
                $refSheet->setCellValue('D1', 'Status');
                foreach ($statuses as $i => $status) {
                    $refSheet->setCellValue('D' . ($i + 2), $status);
                }

                // Header style untuk sheet referensi
                $refSheet->getStyle('A1:D1')->applyFromArray([
                    'font' => ['bold' => true],
                ]);

                // Sembunyikan sheet master data
                $refSheet->setSheetState(Worksheet::SHEETSTATE_HIDDEN);

                // ========== Dropdown Validation ==========
                $catCount = count($this->categories);
                $locCount = count($this->locations);
                $brandCount = count($this->brands);

                // Kolom C = Kategori (dropdown dari master data)
                if ($catCount > 0) {
                    $formula = '_MasterData!$A$2:$A$' . ($catCount + 1);
                    for ($row = 2; $row <= $maxRow; $row++) {
                        $validation = $sheet->getCell('C' . $row)->getDataValidation();
                        $validation->setType(DataValidation::TYPE_LIST);
                        $validation->setErrorStyle(DataValidation::STYLE_WARNING);
                        $validation->setAllowBlank(true);
                        $validation->setShowDropDown(true);
                        $validation->setShowErrorMessage(true);
                        $validation->setErrorTitle('Kategori tidak ditemukan');
                        $validation->setError('Pilih dari daftar atau ketik nama baru (akan dibuat otomatis).');
                        $validation->setPromptTitle('Kategori');
                        $validation->setPrompt('Pilih kategori yang ada, atau ketik nama baru.');
                        $validation->setShowInputMessage(true);
                        $validation->setFormula1($formula);
                    }
                }

                // Kolom D = Merek (dropdown dari master data)
                if ($brandCount > 0) {
                    $formula = '_MasterData!$C$2:$C$' . ($brandCount + 1);
                    for ($row = 2; $row <= $maxRow; $row++) {
                        $validation = $sheet->getCell('D' . $row)->getDataValidation();
                        $validation->setType(DataValidation::TYPE_LIST);
                        $validation->setErrorStyle(DataValidation::STYLE_WARNING);
                        $validation->setAllowBlank(true);
                        $validation->setShowDropDown(true);
                        $validation->setShowErrorMessage(true);
                        $validation->setErrorTitle('Merek tidak ditemukan');
                        $validation->setError('Pilih dari daftar atau ketik nama baru.');
                        $validation->setPromptTitle('Merek');
                        $validation->setPrompt('Pilih merek yang ada, atau ketik nama baru.');
                        $validation->setShowInputMessage(true);
                        $validation->setFormula1($formula);
                    }
                }

                // Kolom H = Lokasi (dropdown dari master data)
                if ($locCount > 0) {
                    $formula = '_MasterData!$B$2:$B$' . ($locCount + 1);
                    for ($row = 2; $row <= $maxRow; $row++) {
                        $validation = $sheet->getCell('H' . $row)->getDataValidation();
                        $validation->setType(DataValidation::TYPE_LIST);
                        $validation->setErrorStyle(DataValidation::STYLE_WARNING);
                        $validation->setAllowBlank(true);
                        $validation->setShowDropDown(true);
                        $validation->setShowErrorMessage(true);
                        $validation->setErrorTitle('Lokasi tidak ditemukan');
                        $validation->setError('Pilih dari daftar atau ketik nama baru.');
                        $validation->setPromptTitle('Lokasi');
                        $validation->setPrompt('Pilih lokasi yang ada, atau ketik nama baru.');
                        $validation->setShowInputMessage(true);
                        $validation->setFormula1($formula);
                    }
                }

                // Kolom I = Status (dropdown statis, strict)
                $formula = '_MasterData!$D$2:$D$6';
                for ($row = 2; $row <= $maxRow; $row++) {
                    $validation = $sheet->getCell('I' . $row)->getDataValidation();
                    $validation->setType(DataValidation::TYPE_LIST);
                    $validation->setErrorStyle(DataValidation::STYLE_STOP);
                    $validation->setAllowBlank(true);
                    $validation->setShowDropDown(true);
                    $validation->setShowErrorMessage(true);
                    $validation->setErrorTitle('Status tidak valid');
                    $validation->setError('Pilih salah satu: Tersedia, Digunakan, Maintenance, Rusak, Dibuang');
                    $validation->setPromptTitle('Status');
                    $validation->setPrompt('Pilih status asset.');
                    $validation->setShowInputMessage(true);
                    $validation->setFormula1($formula);
                }

                // Kembali ke sheet utama saat file dibuka
                $spreadsheet->setActiveSheetIndex(0);
            },
        ];
    }

    public function title(): string
    {
        return 'Template Import Asset';
    }
}

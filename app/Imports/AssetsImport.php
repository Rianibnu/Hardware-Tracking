<?php

namespace App\Imports;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use App\Models\Brand;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Str;

class AssetsImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows, SkipsOnFailure
{
    use SkipsFailures;

    protected int $importedCount = 0;
    protected int $skippedCount = 0;

    /**
     * Heading row mapping — mendukung nama kolom bahasa Indonesia
     */
    public function model(array $row)
    {
        // Cari atau buat Kategori berdasarkan nama
        $categoryName = trim($row['kategori'] ?? $row['category'] ?? '');
        if (empty($categoryName)) {
            $this->skippedCount++;
            return null;
        }
        $category = Category::firstOrCreate(
            ['name' => $categoryName],
            ['description' => null]
        );

        // Cari atau buat Lokasi berdasarkan nama
        $locationName = trim($row['lokasi'] ?? $row['location'] ?? '');
        if (empty($locationName)) {
            $this->skippedCount++;
            return null;
        }
        $location = Location::firstOrCreate(
            ['name' => $locationName],
            ['building' => null, 'floor' => null, 'room' => null]
        );

        // Cari atau buat Brand berdasarkan nama (opsional)
        $brandName = trim($row['merek'] ?? $row['brand'] ?? '');
        $brand = null;
        if (!empty($brandName)) {
            $brand = Brand::firstOrCreate(
                ['name' => $brandName],
                ['description' => null]
            );
        }

        // Generate kode unik jika belum ada
        $code = trim($row['kode_asset'] ?? $row['kode'] ?? $row['code'] ?? '');
        if (empty($code)) {
            $code = 'AST-' . strtoupper(Str::random(8));
        }

        // Cek duplikat kode — skip jika sudah ada
        if (Asset::where('code', $code)->exists()) {
            $this->skippedCount++;
            return null;
        }

        // Map status dari bahasa Indonesia ke enum database
        $statusRaw = strtolower(trim($row['status'] ?? 'available'));
        $statusMap = [
            'tersedia'    => 'available',
            'available'   => 'available',
            'digunakan'   => 'in_use',
            'in_use'      => 'in_use',
            'in use'      => 'in_use',
            'maintenance' => 'maintenance',
            'rusak'       => 'broken',
            'broken'      => 'broken',
            'dibuang'     => 'disposed',
            'disposed'    => 'disposed',
        ];
        $status = $statusMap[$statusRaw] ?? 'available';

        $this->importedCount++;

        return new Asset([
            'code'          => $code,
            'name'          => trim($row['nama_asset'] ?? $row['nama'] ?? $row['name'] ?? ''),
            'category_id'   => $category->id,
            'location_id'   => $location->id,
            'brand_id'      => $brand?->id,
            'model'         => trim($row['model'] ?? '') ?: null,
            'serial_number' => trim($row['serial_number'] ?? $row['sn'] ?? '') ?: null,
            'purchase_year' => !empty($row['tahun_beli'] ?? $row['purchase_year'] ?? null)
                ? (int) ($row['tahun_beli'] ?? $row['purchase_year'])
                : null,
            'status'        => $status,
            'notes'         => trim($row['catatan'] ?? $row['notes'] ?? '') ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            // Minimal nama asset dan kategori harus diisi
            '*.nama_asset'  => 'required_without_all:*.nama,*.name',
            '*.nama'        => 'required_without_all:*.nama_asset,*.name',
            '*.name'        => 'required_without_all:*.nama_asset,*.nama',
        ];
    }

    /**
     * Override validation agar lebih fleksibel
     * — cukup pastikan salah satu kolom nama ada
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Biarkan SkipsOnFailure handle individual row errors
        });
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function getSkippedCount(): int
    {
        return $this->skippedCount;
    }
}

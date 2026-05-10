<?php

namespace App\Imports;

use App\Models\Location;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class LocationsImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows, SkipsOnFailure
{
    use SkipsFailures;

    protected int $importedCount = 0;
    protected int $skippedCount = 0;

    public function model(array $row)
    {
        $name = trim($row['nama_lokasi'] ?? $row['nama'] ?? $row['name'] ?? '');

        if (empty($name)) {
            $this->skippedCount++;
            return null;
        }

        // Skip jika nama lokasi sudah ada
        if (Location::where('name', $name)->exists()) {
            $this->skippedCount++;
            return null;
        }

        $this->importedCount++;

        return new Location([
            'name'        => $name,
            'building'    => trim($row['gedung'] ?? $row['building'] ?? '') ?: null,
            'floor'       => trim($row['lantai'] ?? $row['floor'] ?? '') ?: null,
            'room'        => trim($row['ruangan'] ?? $row['room'] ?? '') ?: null,
            'description' => trim($row['keterangan'] ?? $row['description'] ?? '') ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            '*.nama_lokasi' => 'required_without_all:*.nama,*.name',
            '*.nama'        => 'required_without_all:*.nama_lokasi,*.name',
            '*.name'        => 'required_without_all:*.nama_lokasi,*.nama',
        ];
    }

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

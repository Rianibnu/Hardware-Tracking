<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Exports\LocationImportTemplate;
use App\Imports\LocationsImport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('masters/locations', [
            'locations' => Location::query()
                ->when($request->sort, function ($q) use ($request) {
                    $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
                }, fn ($q) => $q->orderBy('name'))
                ->paginate(15)
                ->withQueryString()
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:locations,name',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);
        Location::create($data);
        return back()->with('success', 'Lokasi berhasil ditambahkan');
    }

    public function update(Request $request, Location $location)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:locations,name,' . $location->id,
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);
        $location->update($data);
        return back()->with('success', 'Lokasi berhasil diperbarui');
    }

    public function destroy(Location $location)
    {
        $location->delete();
        return back()->with('success', 'Lokasi berhasil dihapus');
    }

    public function downloadTemplate()
    {
        return Excel::download(new LocationImportTemplate(), 'template_import_lokasi.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new LocationsImport();
        Excel::import($import, $request->file('file'));

        $imported = $import->getImportedCount();
        $skipped  = $import->getSkippedCount();
        $failures = $import->failures();

        $message = "Berhasil mengimpor {$imported} data lokasi.";
        if ($skipped > 0) {
            $message .= " {$skipped} baris dilewati (duplikat/tidak lengkap).";
        }
        if ($failures->count() > 0) {
            $message .= " {$failures->count()} baris gagal validasi.";
        }

        return back()->with('success', $message);
    }
}

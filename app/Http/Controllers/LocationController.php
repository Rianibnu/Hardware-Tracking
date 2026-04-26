<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        ]);
        $location->update($data);
        return back()->with('success', 'Lokasi berhasil diperbarui');
    }

    public function destroy(Location $location)
    {
        $location->delete();
        return back()->with('success', 'Lokasi berhasil dihapus');
    }
}

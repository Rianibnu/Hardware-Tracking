<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('masters/brands', [
            'brands' => Brand::query()
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
            'name' => 'required|string|max:255|unique:brands,name',
            'description' => 'nullable|string'
        ]);
        Brand::create($data);
        return back()->with('success', 'Brand berhasil ditambahkan');
    }

    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,' . $brand->id,
            'description' => 'nullable|string'
        ]);
        $brand->update($data);
        return back()->with('success', 'Brand berhasil diperbarui');
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return back()->with('success', 'Brand berhasil dihapus');
    }
}

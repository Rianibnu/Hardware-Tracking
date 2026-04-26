<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('masters/categories', [
            'categories' => Category::query()
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
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string'
        ]);
        Category::create($data);
        return back()->with('success', 'Kategori berhasil ditambahkan');
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string'
        ]);
        $category->update($data);
        return back()->with('success', 'Kategori berhasil diperbarui');
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return back()->with('success', 'Kategori berhasil dihapus');
    }
}

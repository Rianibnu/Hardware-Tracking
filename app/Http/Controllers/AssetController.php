<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use App\Services\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function __construct(private AssetService $assetService) {}

    public function index(Request $request): Response
    {
        $assets = Asset::with(['category', 'location', 'brand'])
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('code', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->location_id, fn ($q) => $q->where('location_id', $request->location_id))
            ->when($request->sort, function ($q) use ($request) {
                $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
            }, fn ($q) => $q->latest())
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('assets/index', [
            'assets'  => $assets,
            'filters' => $request->only(['search', 'status', 'category_id', 'location_id', 'sort', 'dir']),
            'auth'    => ['user' => auth()->user()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('assets/create', [
            'categories' => Category::orderBy('name')->get(),
            'locations'  => Location::orderBy('name')->get(),
            'brands'     => \App\Models\Brand::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code'          => 'nullable|string|unique:assets,code',
            'name'          => 'required|string|max:255',
            'category_id'   => 'required|exists:categories,id',
            'serial_number' => 'nullable|string|max:255',
            'brand_id'      => 'nullable|exists:brands,id',
            'model'         => 'nullable|string|max:255',
            'purchase_year' => 'nullable|integer|min:2000|max:2100',
            'status'        => 'nullable|in:available,in_use,maintenance,broken,disposed',
            'location_id'   => 'required|exists:locations,id',
            'notes'         => 'nullable|string',
        ]);

        $asset = $this->assetService->create($data);

        return redirect()->route('assets.show', $asset)->with('success', 'Asset berhasil ditambahkan!');
    }

    public function show(Asset $asset): Response
    {
        $asset->load(['category', 'location', 'brand', 'tickets' => fn($q) => $q->latest()->with(['reporter', 'assignee'])]);

        return Inertia::render('assets/show', [
            'asset'     => $asset->load(['serviceRecords' => fn($q) => $q->with(['creator:id,name', 'completer:id,name'])->latest()]),
            'logs'      => $asset->logs()->with('creator:id,name,role')->latest()->paginate(50),
            'locations' => Location::orderBy('name')->get(['id', 'name', 'building', 'floor', 'room']),
            'auth'      => ['user' => auth()->user()],
            'appUrl'    => config('app.url'),
        ]);
    }

    public function edit(Asset $asset): Response
    {
        return Inertia::render('assets/edit', [
            'asset'      => $asset->load(['category', 'location', 'brand']),
            'categories' => Category::orderBy('name')->get(),
            'locations'  => Location::orderBy('name')->get(),
            'brands'     => \App\Models\Brand::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Asset $asset): RedirectResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'category_id'   => 'sometimes|exists:categories,id',
            'serial_number' => 'nullable|string|max:255',
            'brand_id'      => 'nullable|exists:brands,id',
            'model'         => 'nullable|string|max:255',
            'purchase_year' => 'nullable|integer|min:2000|max:2100',
            'status'        => 'sometimes|in:available,in_use,maintenance,broken,disposed',
            'location_id'   => 'sometimes|exists:locations,id',
            'notes'         => 'nullable|string',
        ]);

        $this->assetService->update($asset, $data);

        return redirect()->route('assets.show', $asset)->with('success', 'Asset berhasil diperbarui!');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        $this->assetService->delete($asset);

        return redirect()->route('assets.index')->with('success', 'Asset berhasil dihapus!');
    }

    public function mutate(Request $request, Asset $asset): RedirectResponse
    {
        $data = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'reason'      => 'nullable|string|max:500',
        ]);

        if ((int) $data['location_id'] === $asset->location_id) {
            return back()->with('error', 'Lokasi tujuan sama dengan lokasi saat ini.');
        }

        $this->assetService->mutate($asset, (int) $data['location_id'], $data['reason'] ?? null);

        return back()->with('success', 'Asset berhasil dimutasi ke lokasi baru!');
    }

    public function publicShow(string $code): Response|RedirectResponse
    {
        $asset = Asset::with(['category', 'location', 'brand'])->where('code', $code)->first();
        if (! $asset) {
            return redirect()->route('home')->with('error', 'Asset dengan kode ini tidak ditemukan.');
        }

        return Inertia::render('assets/public-show', [
            'asset' => $asset,
        ]);
    }
}

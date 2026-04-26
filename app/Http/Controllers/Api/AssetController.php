<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function __construct(private AssetService $assetService) {}

    public function index(Request $request): JsonResponse
    {
        $assets = Asset::with(['category', 'location'])
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('code', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->location_id, fn ($q) => $q->where('location_id', $request->location_id))
            ->latest()
            ->paginate(15);

        return response()->json($assets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'          => 'nullable|string|unique:assets,code',
            'name'          => 'required|string|max:255',
            'category_id'   => 'required|exists:categories,id',
            'serial_number' => 'nullable|string|max:255',
            'brand'         => 'nullable|string|max:255',
            'model'         => 'nullable|string|max:255',
            'purchase_year' => 'nullable|integer|min:2000|max:2100',
            'status'        => 'nullable|in:available,in_use,maintenance,broken,disposed',
            'location_id'   => 'required|exists:locations,id',
            'notes'         => 'nullable|string',
        ]);

        $asset = $this->assetService->create($data);
        $asset->load(['category', 'location']);

        return response()->json($asset, 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        return response()->json($asset->load(['category', 'location', 'tickets.reporter', 'tickets.assignee']));
    }

    public function showByCode(string $code): JsonResponse
    {
        $asset = Asset::where('code', $code)->with(['category', 'location'])->firstOrFail();

        return response()->json($asset);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'category_id'   => 'sometimes|exists:categories,id',
            'serial_number' => 'nullable|string|max:255',
            'brand'         => 'nullable|string|max:255',
            'model'         => 'nullable|string|max:255',
            'purchase_year' => 'nullable|integer|min:2000|max:2100',
            'status'        => 'sometimes|in:available,in_use,maintenance,broken,disposed',
            'location_id'   => 'sometimes|exists:locations,id',
            'notes'         => 'nullable|string',
        ]);

        $asset = $this->assetService->update($asset, $data);

        return response()->json($asset->load(['category', 'location']));
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $this->assetService->delete($asset);

        return response()->json(['message' => 'Asset berhasil dihapus.']);
    }

    public function logs(Asset $asset): JsonResponse
    {
        $logs = $asset->logs()->with('creator:id,name,role')->latest()->paginate(20);

        return response()->json($logs);
    }
}

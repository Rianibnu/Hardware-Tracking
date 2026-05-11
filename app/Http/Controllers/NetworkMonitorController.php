<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Services\NetworkMonitorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NetworkMonitorController extends Controller
{
    public function __construct(private NetworkMonitorService $networkService) {}

    /**
     * Display the Network Monitor page.
     */
    public function index(Request $request): Response
    {
        $assets = Asset::with(['category', 'location'])
            ->whereNotNull('ip_address')
            ->where('ip_address', '!=', '')
            ->when($request->location_id, fn($q) => $q->where('location_id', $request->location_id))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->orderBy('name')
            ->get();

        // Count all assets with and without IP
        $totalWithIp = $assets->count();
        $totalWithoutIp = Asset::whereNull('ip_address')
            ->orWhere('ip_address', '')
            ->count();

        // Get recent heartbeats
        $recentHeartbeats = Asset::with(['category', 'location'])
            ->whereNotNull('last_heartbeat')
            ->orderByDesc('last_heartbeat')
            ->limit(20)
            ->get()
            ->map(fn($a) => [
                'id'             => $a->id,
                'code'           => $a->code,
                'name'           => $a->name,
                'ip_address'     => $a->ip_address,
                'last_heartbeat' => $a->last_heartbeat,
                'agent_data'     => $a->agent_data,
                'location'       => $a->location?->name,
                'category'       => $a->category?->name,
            ]);

        return Inertia::render('network-monitor', [
            'assets' => $assets->map(fn($a) => [
                'id'                 => $a->id,
                'code'               => $a->code,
                'name'               => $a->name,
                'ip_address'         => $a->ip_address,
                'status'             => $a->status,
                'last_heartbeat'     => $a->last_heartbeat,
                'agent_data'         => $a->agent_data,
                'remote_access_type' => $a->remote_access_type,
                'remote_access_id'   => $a->remote_access_id,
                'location'           => $a->location?->name,
                'category'           => $a->category?->name,
            ]),
            'totalWithIp'    => $totalWithIp,
            'totalWithoutIp' => $totalWithoutIp,
            'recentHeartbeats' => $recentHeartbeats,
            'locations' => \App\Models\Location::orderBy('name')->get(['id', 'name']),
            'categories' => \App\Models\Category::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['location_id', 'category_id']),
            'auth' => ['user' => auth()->user()],
        ]);
    }

    /**
     * Ping a single asset by ID.
     */
    public function pingAsset(Asset $asset): JsonResponse
    {
        if (empty($asset->ip_address)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Asset tidak memiliki IP address.',
            ], 422);
        }

        $latency = $this->networkService->ping($asset->ip_address);

        return response()->json([
            'asset_id' => $asset->id,
            'ip'       => $asset->ip_address,
            'status'   => $latency >= 0 ? 'online' : 'offline',
            'latency'  => $latency >= 0 ? $latency : null,
        ]);
    }

    /**
     * Batch ping - ping all assets with IP addresses.
     */
    public function pingAll(Request $request): JsonResponse
    {
        $assets = Asset::with(['category', 'location'])
            ->whereNotNull('ip_address')
            ->where('ip_address', '!=', '')
            ->when($request->location_id, fn($q) => $q->where('location_id', $request->location_id))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->get();

        $results = $this->networkService->pingAssets($assets);
        $stats = $this->networkService->getNetworkStats($results);

        return response()->json([
            'results' => $results,
            'stats'   => $stats,
        ]);
    }
}

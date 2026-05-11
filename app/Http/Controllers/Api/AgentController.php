<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    /**
     * Receive heartbeat data from the monitoring agent.
     * The agent identifies itself by hostname, IP address, or serial number.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'hostname'      => 'required|string|max:255',
            'ip_address'    => 'required|string|max:45',
            'serial_number' => 'nullable|string|max:255',
            'os'            => 'nullable|string|max:255',
            'cpu'           => 'nullable|string|max:255',
            'ram_total'     => 'nullable|string|max:50',
            'ram_used'      => 'nullable|string|max:50',
            'disk_total'    => 'nullable|string|max:50',
            'disk_used'     => 'nullable|string|max:50',
            'uptime'        => 'nullable|string|max:100',
            'mac_address'   => 'nullable|string|max:17',
            'logged_in_user' => 'nullable|string|max:255',
            'agent_version' => 'nullable|string|max:20',
        ]);

        // Try to match asset by serial_number first, then IP, then hostname
        $asset = null;

        if (!empty($data['serial_number'])) {
            $asset = Asset::where('serial_number', $data['serial_number'])->first();
        }

        if (!$asset && !empty($data['ip_address'])) {
            $asset = Asset::where('ip_address', $data['ip_address'])->first();
        }

        if (!$asset) {
            $asset = Asset::where('name', 'like', '%' . $data['hostname'] . '%')->first();
        }

        if (!$asset) {
            return response()->json([
                'status'  => 'unregistered',
                'message' => 'No matching asset found. Register this device first.',
                'match'   => [
                    'hostname'      => $data['hostname'],
                    'ip_address'    => $data['ip_address'],
                    'serial_number' => $data['serial_number'] ?? null,
                ],
            ], 404);
        }

        // Build agent data payload
        $agentData = [
            'hostname'       => $data['hostname'],
            'os'             => $data['os'] ?? null,
            'cpu'            => $data['cpu'] ?? null,
            'ram_total'      => $data['ram_total'] ?? null,
            'ram_used'       => $data['ram_used'] ?? null,
            'disk_total'     => $data['disk_total'] ?? null,
            'disk_used'      => $data['disk_used'] ?? null,
            'uptime'         => $data['uptime'] ?? null,
            'mac_address'    => $data['mac_address'] ?? null,
            'logged_in_user' => $data['logged_in_user'] ?? null,
            'agent_version'  => $data['agent_version'] ?? null,
            'collected_at'   => now()->toIso8601String(),
        ];

        // Update asset with heartbeat data
        $asset->update([
            'last_heartbeat' => now(),
            'agent_data'     => $agentData,
            'ip_address'     => $data['ip_address'], // keep IP up to date
        ]);

        // Also update RAM capacity if provided
        if (!empty($data['ram_total'])) {
            $asset->update(['ram_capacity' => $data['ram_total']]);
        }

        return response()->json([
            'status'   => 'ok',
            'asset_id' => $asset->id,
            'code'     => $asset->code,
            'name'     => $asset->name,
            'message'  => 'Heartbeat received successfully.',
        ]);
    }

    /**
     * Auto-register a new asset from agent data.
     */
    public function autoRegister(Request $request): JsonResponse
    {
        $data = $request->validate([
            'hostname'       => 'required|string|max:255',
            'ip_address'     => 'required|string|max:45',
            'serial_number'  => 'nullable|string|max:255',
            'category_id'    => 'required|exists:categories,id',
            'location_id'    => 'required|exists:locations,id',
            'os'             => 'nullable|string|max:255',
            'cpu'            => 'nullable|string|max:255',
            'ram_total'      => 'nullable|string|max:50',
            'disk_total'     => 'nullable|string|max:50',
            'mac_address'    => 'nullable|string|max:17',
        ]);

        // Check if already registered
        $existing = null;
        if (!empty($data['serial_number'])) {
            $existing = Asset::where('serial_number', $data['serial_number'])->first();
        }
        if (!$existing) {
            $existing = Asset::where('ip_address', $data['ip_address'])->first();
        }

        if ($existing) {
            return response()->json([
                'status'  => 'exists',
                'asset_id' => $existing->id,
                'message' => 'Asset already registered.',
            ], 409);
        }

        $asset = Asset::create([
            'name'          => $data['hostname'],
            'ip_address'    => $data['ip_address'],
            'serial_number' => $data['serial_number'] ?? null,
            'category_id'   => $data['category_id'],
            'location_id'   => $data['location_id'],
            'ram_capacity'  => $data['ram_total'] ?? null,
            'status'        => 'in_use',
            'last_heartbeat' => now(),
            'agent_data'    => [
                'hostname'   => $data['hostname'],
                'os'         => $data['os'] ?? null,
                'cpu'        => $data['cpu'] ?? null,
                'ram_total'  => $data['ram_total'] ?? null,
                'disk_total' => $data['disk_total'] ?? null,
                'mac_address' => $data['mac_address'] ?? null,
                'collected_at' => now()->toIso8601String(),
            ],
        ]);

        return response()->json([
            'status'   => 'registered',
            'asset_id' => $asset->id,
            'code'     => $asset->code,
            'message'  => 'Asset auto-registered successfully.',
        ], 201);
    }
}

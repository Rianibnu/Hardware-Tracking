<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index()
    {
        $audits = \App\Models\Audit::with(['location', 'creator'])
            ->withCount('details')
            ->latest()
            ->paginate(15);
            
        return \Inertia\Inertia::render('audits/index', [
            'audits' => $audits,
            'locations' => \App\Models\Location::orderBy('name')->get()
        ]);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'notes' => 'nullable|string'
        ]);

        // Create the Audit
        $audit = \App\Models\Audit::create([
            'location_id' => $request->location_id,
            'status' => 'ongoing',
            'created_by' => auth()->id(),
            'notes' => $request->notes,
        ]);

        // Get all assets expected in this location
        $assets = \App\Models\Asset::where('location_id', $request->location_id)
            ->whereNotIn('status', ['dipinjam', 'rusak berat']) // Maybe skip some statuses, adjust as needed
            ->get();

        // Create AuditDetails for expected assets
        $details = $assets->map(function ($asset) use ($audit) {
            return [
                'audit_id' => $audit->id,
                'asset_id' => $asset->id,
                'status' => 'expected',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->toArray();

        \App\Models\AuditDetail::insert($details);

        return redirect()->route('audits.show', $audit->id)
            ->with('success', 'Audit sesi baru telah dimulai.');
    }

    public function show(\App\Models\Audit $audit)
    {
        $audit->load('location');
        
        $details = $audit->details()->with('asset.category', 'asset.brand')->get();
        
        $stats = [
            'total' => $details->count(),
            'expected' => $details->where('status', 'expected')->count(),
            'found' => $details->where('status', 'found')->count(),
            'missing' => $details->where('status', 'missing')->count(),
            'wrong_location' => $details->where('status', 'wrong_location')->count(),
        ];

        return \Inertia\Inertia::render('audits/show', [
            'audit' => $audit,
            'details' => $details,
            'stats' => $stats
        ]);
    }

    public function scan(\Illuminate\Http\Request $request, \App\Models\Audit $audit)
    {
        if ($audit->status === 'completed') {
            return back()->with('error', 'Audit ini sudah selesai.');
        }

        $request->validate([
            'asset_code' => 'required|string|exists:assets,code'
        ]);

        $asset = \App\Models\Asset::where('code', $request->asset_code)->first();

        // Check if asset is part of this audit
        $detail = $audit->details()->where('asset_id', $asset->id)->first();

        if ($detail) {
            // Asset is expected
            if ($detail->status === 'found') {
                return back()->with('info', 'Aset sudah discan sebelumnya.');
            }
            
            $detail->update([
                'status' => 'found',
                'scanned_at' => now()
            ]);

            return back()->with('success', 'Aset ditemukan: ' . $asset->name);
        } else {
            // Asset is NOT expected in this location (Wrong Location)
            $audit->details()->create([
                'asset_id' => $asset->id,
                'status' => 'wrong_location',
                'scanned_at' => now(),
                'notes' => 'Seharusnya di lokasi: ' . ($asset->location ? $asset->location->name : 'Unknown')
            ]);

            return back()->with('warning', 'Aset salah lokasi: ' . $asset->name);
        }
    }

    public function complete(\Illuminate\Http\Request $request, \App\Models\Audit $audit)
    {
        if ($audit->status === 'completed') {
            return back()->with('error', 'Audit sudah selesai sebelumnya.');
        }

        // Mark remaining expected assets as missing
        $audit->details()->where('status', 'expected')->update([
            'status' => 'missing'
        ]);

        $audit->update([
            'status' => 'completed',
            'end_date' => now(),
        ]);

        return redirect()->route('audits.index')
            ->with('success', 'Audit berhasil diselesaikan.');
    }
}

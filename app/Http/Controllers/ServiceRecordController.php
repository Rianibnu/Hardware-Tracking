<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetLog;
use App\Models\ServiceRecord;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceRecordController extends Controller
{
    public function index(Request $request): Response
    {
        $records = ServiceRecord::with(['asset', 'creator', 'completer'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->sort, function ($q) use ($request) {
                $q->orderBy($request->sort, $request->dir === 'asc' ? 'asc' : 'desc');
            }, fn ($q) => $q->latest())
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('services/index', [
            'records' => $records,
            'filters' => $request->only(['status', 'sort', 'dir']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'ticket_id' => 'nullable|exists:tickets,id',
            'vendor_name' => 'required|string|max:255',
            'service_description' => 'required|string',
            'estimated_completion_date' => 'nullable|date',
            'cost' => 'nullable|numeric|min:0',
        ]);

        $record = ServiceRecord::create([
            ...$data,
            'status' => 'in_progress',
            'created_by' => auth()->id(),
        ]);

        $asset = Asset::find($data['asset_id']);
        $asset->update(['status' => 'maintenance']);

        AssetLog::create([
            'asset_id' => $asset->id,
            'action' => 'maintenance',
            'description' => "Asset diservis ke pihak 3: {$record->vendor_name}",
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Catatan servis pihak ketiga berhasil ditambahkan.');
    }

    public function complete(Request $request, ServiceRecord $serviceRecord): RedirectResponse
    {
        \Log::info('ServiceRecord complete called: ' . $serviceRecord->id, $request->all());

        $data = $request->validate([
            'cost' => 'nullable|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        $serviceRecord->update([
            'status' => 'completed',
            'cost' => $data['cost'] ?? $serviceRecord->cost,
            'completed_by' => auth()->id(),
            'completed_at' => now(),
        ]);

        $asset = $serviceRecord->asset;
        $asset->update(['status' => 'available']);

        if ($serviceRecord->ticket_id) {
            $ticket = $serviceRecord->ticket;
            if ($ticket && $ticket->status !== 'closed') {
                app(TicketService::class)->close($ticket, "Servis dari {$serviceRecord->vendor_name} selesai otomatis.");
            }
        }

        AssetLog::create([
            'asset_id' => $asset->id,
            'action' => 'status_change',
            'description' => "Servis dari {$serviceRecord->vendor_name} selesai. " . ($data['note'] ?? ''),
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Servis telah selesai dan aset tersedia kembali.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Notification;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(private TicketService $ticketService) {}

    public function index(Request $request): Response
    {
        $user = auth()->user();

        $query = Ticket::with(['asset', 'reporter:id,name', 'assignee:id,name'])
            ->when($request->search, function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhereHas('asset', fn($q2) => $q2->where('name', 'like', "%{$request->search}%"));
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->priority, fn ($q) => $q->where('priority', $request->priority));

        if ($user->role === 'teknisi') {
            $query->where(fn ($q) => $q
                ->where('assigned_to', $user->id)
                ->orWhere('reported_by', $user->id)
                ->orWhere(fn ($q2) => $q2->whereNull('assigned_to')->where('status', 'open'))
            );
        }

        $tickets = $query->latest()->paginate(15)->withQueryString();

        $statsQuery = Ticket::query();
        if ($user->role === 'teknisi') {
            $statsQuery->where(fn ($q) => $q
                ->where('assigned_to', $user->id)
                ->orWhere('reported_by', $user->id)
                ->orWhere(fn ($q2) => $q2->whereNull('assigned_to')->where('status', 'open'))
            );
        }

        $stats = [
            'open'     => (clone $statsQuery)->where('status', 'open')->count(),
            'progress' => (clone $statsQuery)->where('status', 'progress')->count(),
            'done'     => (clone $statsQuery)->where('status', 'done')->count(),
            'closed'   => (clone $statsQuery)->where('status', 'closed')->count(),
        ];

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'filters' => $request->only(['search', 'status', 'priority']),
            'stats'   => $stats,
            'auth'    => ['user' => $user],
        ]);
    }

    public function create(Request $request): Response
    {
        $assetId = $request->query('asset_id');

        return Inertia::render('tickets/create', [
            'assets' => Asset::with(['category', 'location'])
                ->where('status', '!=', 'disposed')
                ->orderBy('name')
                ->get(),
            'asset'  => $assetId ? Asset::with(['category', 'location'])->find($assetId) : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'asset_id'    => 'required|exists:assets,id',
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'priority'    => 'nullable|in:low,medium,high',
        ]);

        $ticket = $this->ticketService->create($data);

        return redirect()->route('tickets.show', $ticket)->with('success', 'Laporan berhasil dikirim!');
    }

    public function publicStore(Request $request, string $code): RedirectResponse
    {
        $asset = Asset::where('code', $code)->firstOrFail();

        $data = $request->validate([
            'reporter_name' => 'required|string|max:255',
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'priority'    => 'nullable|in:low,medium,high',
        ]);

        $ticket = Ticket::create([
            'asset_id'      => $asset->id,
            'reporter_name' => $data['reporter_name'],
            'title'         => $data['title'],
            'description'   => $data['description'],
            'priority'      => $data['priority'] ?? 'medium',
            'status'        => 'open',
        ]);

        \App\Models\TicketLog::create([
            'ticket_id'   => $ticket->id,
            'status_from' => null,
            'status_to'   => 'open',
            'note'        => 'Dilaporkan oleh Publik: ' . $data['reporter_name'],
            'created_by'  => null,
        ]);

        // Auto set asset ke maintenance
        $ticket->asset()->update(['status' => 'maintenance']);
        \App\Models\AssetLog::create([
            'asset_id'    => $ticket->asset_id,
            'action'      => 'maintenance',
            'description' => 'Asset masuk maintenance karena ticket publik #' . $ticket->id,
            'created_by'  => null,
        ]);

        // Notify Admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::send(
                $admin->id,
                'info',
                'Laporan Publik',
                "Laporan masalah publik baru: {$ticket->title}",
                "/tickets/{$ticket->id}"
            );
        }

        return back()->with('success', 'Laporan berhasil dikirim! Tim IT akan segera menindaklanjuti.');
    }

    public function quickMaintenance(Request $request, Asset $asset): RedirectResponse
    {
        $user = auth()->user();

        $ticket = Ticket::create([
            'asset_id'      => $asset->id,
            'reported_by'   => $user->id,
            'assigned_to'   => $user->id,
            'title'         => 'Maintenance Langsung',
            'description'   => 'Dikerjakan langsung tanpa laporan awal',
            'priority'      => 'medium',
            'status'        => 'progress',
        ]);

        \App\Models\TicketLog::create([
            'ticket_id'   => $ticket->id,
            'status_from' => null,
            'status_to'   => 'progress',
            'note'        => 'Ticket dibuat dan langsung dikerjakan oleh ' . $user->name,
            'created_by'  => $user->id,
        ]);

        $asset->update(['status' => 'maintenance']);
        \App\Models\AssetLog::create([
            'asset_id'    => $asset->id,
            'action'      => 'maintenance',
            'description' => 'Pengerjaan maintenance langsung',
            'created_by'  => $user->id,
        ]);

        // Notify Admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::send(
                $admin->id,
                'info',
                'Maintenance Langsung',
                "{$user->name} memulai maintenance langsung pada asset: {$asset->name}",
                "/tickets/{$ticket->id}"
            );
        }

        return redirect()->route('tickets.show', $ticket)->with('success', 'Berhasil memulai maintenance!');
    }

    public function show(Ticket $ticket): Response
    {
        $ticket->load(['asset', 'reporter:id,name,role', 'assignee:id,name,role', 'logs.creator:id,name,role', 'serviceRecords' => fn($q) => $q->latest()]);

        return Inertia::render('tickets/show', [
            'ticket'       => $ticket,
            'teknisiList'  => User::where('role', 'teknisi')->select('id', 'name', 'email')->get(),
            'auth'         => ['user' => auth()->user()],
        ]);
    }

    public function assign(Request $request, Ticket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'assigned_to' => 'required|exists:users,id',
            'note'        => 'nullable|string',
        ]);

        $this->ticketService->assign($ticket, $data['assigned_to'], $data['note'] ?? null);

        return back()->with('success', 'Ticket berhasil di-assign!');
    }

    public function progress(Request $request, Ticket $ticket): RedirectResponse
    {
        $data = $request->validate(['note' => 'nullable|string']);
        $this->ticketService->progress($ticket, $data['note'] ?? null);

        return back()->with('success', 'Pekerjaan dimulai!');
    }

    public function done(Request $request, Ticket $ticket): RedirectResponse
    {
        $data = $request->validate(['note' => 'required|string']);
        $this->ticketService->done($ticket, $data['note']);

        return back()->with('success', 'Ticket selesai!');
    }

    public function close(Request $request, Ticket $ticket): RedirectResponse
    {
        $data = $request->validate(['note' => 'nullable|string']);
        $this->ticketService->close($ticket, $data['note'] ?? null);

        return back()->with('success', 'Ticket ditutup!');
    }
}

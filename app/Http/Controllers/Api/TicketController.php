<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(private TicketService $ticketService) {}

    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::with(['asset', 'reporter:id,name', 'assignee:id,name'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->priority, fn ($q) => $q->where('priority', $request->priority))
            ->when($request->asset_id, fn ($q) => $q->where('asset_id', $request->asset_id))
            ->when($request->user()->isTeknisi(), fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('assigned_to', $request->user()->id)
                    ->orWhere('reported_by', $request->user()->id);
            }))
            ->latest()
            ->paginate(15);

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'asset_id'    => 'required|exists:assets,id',
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'priority'    => 'nullable|in:low,medium,high',
        ]);

        $ticket = $this->ticketService->create($data);

        return response()->json($ticket, 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return response()->json(
            $ticket->load(['asset', 'reporter:id,name,role', 'assignee:id,name,role', 'logs.creator:id,name'])
        );
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'priority'    => 'sometimes|in:low,medium,high',
        ]);

        $ticket->update($data);

        return response()->json($ticket->fresh());
    }

    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'assigned_to' => 'required|exists:users,id',
            'note'        => 'nullable|string',
        ]);

        $user = User::findOrFail($data['assigned_to']);
        if ($user->role !== 'teknisi') {
            return response()->json(['message' => 'Hanya teknisi yang bisa di-assign.'], 422);
        }

        $ticket = $this->ticketService->assign($ticket, $data['assigned_to'], $data['note'] ?? null);

        return response()->json($ticket);
    }

    public function progress(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate(['note' => 'nullable|string']);
        $ticket = $this->ticketService->progress($ticket, $data['note'] ?? null);

        return response()->json($ticket);
    }

    public function done(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate(['note' => 'required|string']);
        $ticket = $this->ticketService->done($ticket, $data['note']);

        return response()->json($ticket);
    }

    public function close(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate(['note' => 'nullable|string']);
        $ticket = $this->ticketService->close($ticket, $data['note'] ?? null);

        return response()->json($ticket);
    }

    public function logs(Ticket $ticket): JsonResponse
    {
        $logs = $ticket->logs()->with('creator:id,name,role')->latest()->paginate(20);

        return response()->json($logs);
    }
}

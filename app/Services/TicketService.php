<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetLog;
use App\Models\Ticket;
use App\Models\TicketLog;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;

class TicketService
{
    public function create(array $data): Ticket
    {
        $ticket = Ticket::create([
            ...$data,
            'reported_by' => auth()->id(),
            'status'      => 'open',
        ]);

        TicketLog::create([
            'ticket_id'   => $ticket->id,
            'note'        => 'Ticket dibuat: ' . $ticket->title,
            'status_from' => null,
            'status_to'   => 'open',
            'created_by'  => auth()->id(),
        ]);

        // Auto set asset ke maintenance
        $ticket->asset()->update(['status' => 'maintenance']);
        AssetLog::create([
            'asset_id'    => $ticket->asset_id,
            'action'      => 'maintenance',
            'description' => 'Asset masuk maintenance karena ticket #' . $ticket->id,
            'created_by'  => auth()->id(),
        ]);

        // Notify Admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::send(
                $admin->id,
                'info',
                'Tiket Baru',
                "Tiket baru: {$ticket->title}",
                "/tickets/{$ticket->id}"
            );
        }

        return $ticket->load(['asset', 'reporter']);
    }

    public function assign(Ticket $ticket, int $userId, ?string $note = null): Ticket
    {
        $ticket->update(['assigned_to' => $userId]);

        TicketLog::create([
            'ticket_id'  => $ticket->id,
            'note'       => $note ?? 'Ticket di-assign ke teknisi',
            'status_from' => $ticket->status,
            'status_to'  => $ticket->status,
            'created_by' => auth()->id(),
        ]);

        Notification::send(
            $userId,
            'info',
            'Penugasan Tiket',
            "Anda ditugaskan ke tiket: {$ticket->title}",
            "/tickets/{$ticket->id}"
        );

        return $ticket->fresh(['assignee']);
    }

    public function progress(Ticket $ticket, ?string $note = null): Ticket
    {
        $from = $ticket->status;
        $ticket->update(['status' => 'progress']);

        TicketLog::create([
            'ticket_id'   => $ticket->id,
            'note'        => $note ?? 'Pekerjaan dimulai',
            'status_from' => $from,
            'status_to'   => 'progress',
            'created_by'  => auth()->id(),
        ]);

        return $ticket;
    }

    public function done(Ticket $ticket, string $note): Ticket
    {
        $from = $ticket->status;
        
        $updates = ['status' => 'done', 'resolved_at' => \Carbon\Carbon::now()];
        if ($ticket->title === 'Maintenance Langsung') {
            $updates['title'] = "Maintenance Langsung: {$note}";
        }
        
        $ticket->update($updates);

        TicketLog::create([
            'ticket_id'   => $ticket->id,
            'note'        => $note,
            'status_from' => $from,
            'status_to'   => 'done',
            'created_by'  => auth()->id(),
        ]);

        // Auto set asset ke available
        $ticket->asset()->update(['status' => 'available']);
        AssetLog::create([
            'asset_id'    => $ticket->asset_id,
            'action'      => 'status_change',
            'description' => 'Asset kembali available setelah ticket #' . $ticket->id . ' selesai',
            'created_by'  => auth()->id(),
        ]);

        if ($ticket->reported_by) {
            Notification::send(
                $ticket->reported_by,
                'success',
                'Tiket Selesai',
                "Tiket Anda telah diselesaikan: {$ticket->title}",
                "/tickets/{$ticket->id}"
            );
        }

        return $ticket;
    }

    public function close(Ticket $ticket, ?string $note = null): Ticket
    {
        $from = $ticket->status;
        
        $updates = ['status' => 'closed'];
        if ($ticket->title === 'Maintenance Langsung' && $note) {
            $updates['title'] = "Maintenance Langsung: {$note}";
        }
        
        $ticket->update($updates);

        TicketLog::create([
            'ticket_id'   => $ticket->id,
            'note'        => $note ?? 'Ticket ditutup',
            'status_from' => $from,
            'status_to'   => 'closed',
            'created_by'  => auth()->id(),
        ]);

        return $ticket;
    }
}

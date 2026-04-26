<?php

namespace App\Exports;

use App\Models\Ticket;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TicketReportExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Ticket::with(['asset.category', 'reporter', 'assignee'])->latest();

        if (!empty($this->filters['start_date'])) {
            $query->whereDate('created_at', '>=', $this->filters['start_date']);
        }
        if (!empty($this->filters['end_date'])) {
            $query->whereDate('created_at', '<=', $this->filters['end_date']);
        }
        if (!empty($this->filters['technician_id'])) {
            $query->where('assigned_to', $this->filters['technician_id']);
        }
        if (!empty($this->filters['category_id'])) {
            $query->whereHas('asset', fn($q) => $q->where('category_id', $this->filters['category_id']));
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal Laporan',
            'Judul',
            'Deskripsi',
            'Asset',
            'Kategori',
            'Prioritas',
            'Status',
            'Pelapor',
            'Teknisi',
            'Tanggal Selesai',
            'Durasi (Hari)',
        ];
    }

    public function map($ticket): array
    {
        static $no = 0;
        $no++;

        $durasi = $ticket->resolved_at
            ? $ticket->created_at->diffInDays($ticket->resolved_at)
            : '-';

        return [
            $no,
            $ticket->created_at->format('d/m/Y H:i'),
            $ticket->title,
            $ticket->description,
            $ticket->asset?->name ?? '-',
            $ticket->asset?->category?->name ?? '-',
            ucfirst($ticket->priority),
            ucfirst($ticket->status),
            $ticket->reporter?->name ?? ($ticket->reporter_name ?? '-'),
            $ticket->assignee?->name ?? 'Belum ditugaskan',
            $ticket->resolved_at ? $ticket->resolved_at->format('d/m/Y H:i') : '-',
            $durasi,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2563EB'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Laporan Kerusakan';
    }
}

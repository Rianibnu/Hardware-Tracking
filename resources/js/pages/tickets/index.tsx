import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { PaginatedResponse, Ticket, TicketPriority, TicketStatus } from '@/types/inventory';
import { router } from '@inertiajs/react';
import { AlertTriangle, ChevronDown, Clock, Plus, Search, TicketCheck } from 'lucide-react';
import { useState } from 'react';

const STATUS_COLORS: Record<TicketStatus, string> = {
    open: 'bg-red-500/15 text-red-600 border-red-200',
    progress: 'bg-amber-500/15 text-amber-600 border-amber-200',
    done: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    closed: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    progress: 'In Progress',
    done: 'Done',
    closed: 'Closed',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
    low: 'text-zinc-500',
    medium: 'text-amber-600',
    high: 'text-red-600',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
};

interface Props {
    tickets: PaginatedResponse<Ticket>;
    filters: { search?: string; status?: string; priority?: string };
    auth: { user: { role: string } };
    stats: { open: number; progress: number; done: number; closed: number };
}

export default function TicketsIndex({ tickets, filters, auth, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const isAdmin = auth.user.role === 'admin';

    function applyFilters(newSearch?: string, newStatus?: string, newPriority?: string) {
        router.get(
            '/tickets',
            { search: newSearch ?? search, status: newStatus ?? status, priority: newPriority ?? priority },
            { preserveState: true, replace: true },
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ticketing</h1>
                    <p className="text-muted-foreground text-sm">Kelola laporan kerusakan dan perbaikan</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { label: 'Open', value: stats.open, icon: AlertTriangle, color: 'text-red-500', status: 'open' },
                    { label: 'In Progress', value: stats.progress, icon: Clock, color: 'text-amber-500', status: 'progress' },
                    { label: 'Done', value: stats.done, icon: TicketCheck, color: 'text-emerald-500', status: 'done' },
                    { label: 'Closed', value: stats.closed, icon: TicketCheck, color: 'text-zinc-500', status: 'closed' },
                ].map((stat) => (
                    <Card
                        key={stat.label}
                        className="border-border/50 cursor-pointer transition-shadow hover:shadow-md"
                        onClick={() => {
                            setStatus(stat.status);
                            applyFilters(stat.status);
                        }}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                <div>
                                    <p className="text-muted-foreground text-xs">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-border/50">
                <CardContent className="pt-4">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters(search, status, priority);
                        }}
                        className="flex flex-wrap gap-3"
                    >
                        <div className="relative w-full max-w-sm sm:w-auto">
                            <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                            <Input
                                placeholder="Cari judul / deskripsi..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select
                            value={status || 'all'}
                            onValueChange={(v) => {
                                const val = v === 'all' ? '' : v;
                                setStatus(val);
                                applyFilters(undefined, val);
                            }}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={priority || 'all'}
                            onValueChange={(v) => {
                                const val = v === 'all' ? '' : v;
                                setPriority(val);
                                applyFilters(undefined, val);
                            }}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Semua Prioritas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Prioritas</SelectItem>
                                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" />
                            Cari
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Ticket List */}
            <div className="space-y-3">
                {tickets.data.length === 0 && (
                    <Card className="border-border/50">
                        <CardContent className="py-12 text-center">
                            <TicketCheck className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                            <p className="text-muted-foreground text-sm">Tidak ada ticket ditemukan</p>
                        </CardContent>
                    </Card>
                )}

                {tickets.data.map((ticket) => (
                    <Card
                        key={ticket.id}
                        className="border-border/50 cursor-pointer transition-shadow hover:shadow-md"
                        onClick={() => router.visit(`/tickets/${ticket.id}`)}
                    >
                        <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className="text-muted-foreground font-mono text-xs">#{ticket.id}</span>
                                        <Badge variant="outline" className={STATUS_COLORS[ticket.status]}>
                                            {STATUS_LABELS[ticket.status]}
                                        </Badge>
                                        <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                                            ● {PRIORITY_LABELS[ticket.priority]}
                                        </span>
                                    </div>
                                    <h3 className="truncate font-semibold">{ticket.title}</h3>
                                    <p className="text-muted-foreground mt-0.5 truncate text-sm">{ticket.description}</p>
                                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
                                        {ticket.asset && <span>📦 {ticket.asset.name}</span>}
                                        {ticket.reporter && <span>👤 {ticket.reporter.name}</span>}
                                        {ticket.assignee ? (
                                            <span>🔧 {ticket.assignee.name}</span>
                                        ) : (
                                            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-blue-600 font-medium">Belum di-assign</span>
                                        )}
                                        <span>🕐 {new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                                <ChevronDown className="text-muted-foreground mt-1 h-4 w-4 shrink-0 -rotate-90" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {tickets.last_page > 1 && (
                <div className="flex justify-center gap-1">
                    {tickets.links.map((link, i) => (
                        <Button
                            key={i}
                            size="sm"
                            variant={link.active ? 'default' : 'outline'}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

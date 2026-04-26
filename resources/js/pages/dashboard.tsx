import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AssetStatus, TicketStatus } from '@/types/inventory';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Clock, Package, QrCode, TicketCheck, Wrench } from 'lucide-react';

interface DashboardStats {
    assets: { total: number; by_status: Record<AssetStatus, number> };
    tickets: { total: number; by_status: Record<TicketStatus, number> };
    recent_tickets: {
        id: number;
        title: string;
        status: TicketStatus;
        priority: string;
        asset: { name: string };
        reporter: { name: string };
        created_at: string;
    }[];
}

const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
    open: 'bg-red-500/15 text-red-600 border-red-200',
    progress: 'bg-amber-500/15 text-amber-600 border-amber-200',
    done: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    closed: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-zinc-500',
    medium: 'text-amber-600',
    high: 'text-red-600',
};

export default function Dashboard({ stats }: { stats: DashboardStats }) {
    const { auth } = usePage<{ auth: { user: { name: string; role: string } } }>().props;

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6 p-6">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-bold">
                        Halo, {auth.user.name} 👋
                    </h1>
                    <p className="text-muted-foreground text-sm capitalize">
                        {auth.user.role === 'admin' ? '👑 Admin IT' : '🔧 Teknisi'} · Monitoring Inventaris
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => router.visit('/scan-qr')} variant="outline">
                        <QrCode className="mr-2 h-4 w-4" />
                        Scan QR
                    </Button>
                    <Button onClick={() => router.visit('/tickets/create')} variant="outline">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Laporkan Masalah
                    </Button>
                    {auth.user.role === 'admin' && (
                        <Button onClick={() => router.visit('/assets/create')} variant="outline">
                            <Package className="mr-2 h-4 w-4" />
                            Tambah Asset
                        </Button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card className="border-blue-100 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.visit('/assets')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Asset</p>
                                    <p className="text-2xl font-bold">{stats?.assets?.total ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-100 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.visit('/assets?status=maintenance')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                    <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Maintenance</p>
                                    <p className="text-2xl font-bold">{stats?.assets?.by_status?.maintenance ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.visit('/tickets?status=open')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Ticket Open</p>
                                    <p className="text-2xl font-bold">{stats?.tickets?.by_status?.open ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.visit('/tickets?status=progress')}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                    <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">In Progress</p>
                                    <p className="text-2xl font-bold">{stats?.tickets?.by_status?.progress ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Asset Status Overview */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                                Status Asset
                                <Button variant="ghost" size="sm" onClick={() => router.visit('/assets')}>
                                    Lihat Semua →
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { label: 'Tersedia', key: 'available', color: 'bg-emerald-500' },
                                    { label: 'Digunakan', key: 'in_use', color: 'bg-blue-500' },
                                    { label: 'Maintenance', key: 'maintenance', color: 'bg-amber-500' },
                                    { label: 'Rusak', key: 'broken', color: 'bg-red-500' },
                                    { label: 'Dibuang', key: 'disposed', color: 'bg-zinc-400' },
                                ].map(({ label, key, color }) => {
                                    const count = stats?.assets?.by_status?.[key as AssetStatus] ?? 0;
                                    const total = stats?.assets?.total || 1;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={key} className="flex items-center gap-3 text-sm">
                                            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                                            <span className="w-24 text-xs">{label}</span>
                                            <div className="bg-muted flex-1 rounded-full">
                                                <div
                                                    className={`h-2 rounded-full ${color} transition-all`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-muted-foreground w-10 text-right text-xs">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Tickets */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                                Ticket Terbaru
                                <Button variant="ghost" size="sm" onClick={() => router.visit('/tickets')}>
                                    Lihat Semua →
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {(!stats?.recent_tickets || stats.recent_tickets.length === 0) && (
                                    <p className="text-muted-foreground py-4 text-center text-sm">Belum ada ticket</p>
                                )}
                                {stats?.recent_tickets?.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors"
                                        onClick={() => router.visit(`/tickets/${ticket.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">{ticket.title}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {ticket.asset?.name} · {ticket.reporter?.name}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="outline" className={`text-xs ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                                {ticket.status}
                                            </Badge>
                                            <span className={`text-xs ${PRIORITY_COLORS[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Cpu,
    HardDrive,
    LogIn,
    Monitor,
    Package,
    RefreshCw,
    Server,
    Shield,
    Wrench,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    available: 'Tersedia',
    in_use: 'Digunakan',
    maintenance: 'Maintenance',
    broken: 'Rusak',
    disposed: 'Dibuang',
};

const STATUS_ICONS: Record<string, typeof Package> = {
    available: CheckCircle,
    in_use: Monitor,
    maintenance: Wrench,
    broken: AlertTriangle,
    disposed: Package,
};

const STATUS_COLORS: Record<string, string> = {
    available: 'from-emerald-500 to-emerald-600',
    in_use: 'from-blue-500 to-blue-600',
    maintenance: 'from-amber-500 to-amber-600',
    broken: 'from-red-500 to-red-600',
    disposed: 'from-zinc-400 to-zinc-500',
};

const STATUS_DOT: Record<string, string> = {
    available: 'bg-emerald-400',
    in_use: 'bg-blue-400',
    maintenance: 'bg-amber-400',
    broken: 'bg-red-400',
    disposed: 'bg-zinc-400',
};

const TICKET_STATUS: Record<string, { label: string; color: string }> = {
    open: { label: 'Terbuka', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
    progress: { label: 'Dikerjakan', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    done: { label: 'Selesai', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
};

const LOG_LABELS: Record<string, string> = {
    create: 'Ditambahkan',
    update: 'Diperbarui',
    move: 'Dipindahkan',
    status_change: 'Status Berubah',
    maintenance: 'Maintenance',
    delete: 'Dihapus',
};

const LOG_COLORS: Record<string, string> = {
    create: 'bg-emerald-500',
    update: 'bg-blue-500',
    move: 'bg-purple-500',
    status_change: 'bg-orange-500',
    maintenance: 'bg-amber-500',
    delete: 'bg-red-500',
};

interface Props {
    stats: {
        total_assets: number;
        by_status: Record<string, number>;
        open_tickets: number;
        done_tickets: number;
        total_tickets: number;
        recent_tickets: any[];
        recent_logs: any[];
    };
    canRegister: boolean;
}

export default function Welcome({ stats, canRegister }: Props) {
    const { auth } = usePage<any>().props;
    const [activeTab, setActiveTab] = useState<'tickets' | 'activity'>('tickets');
    const fmtTime = (d: string) =>
        new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const healthy = (stats.by_status['available'] ?? 0) + (stats.by_status['in_use'] ?? 0);
    const healthPct = stats.total_assets > 0 ? Math.round((healthy / stats.total_assets) * 100) : 0;

    // --- Shared sub-components ---
    const TicketCard = ({ t }: { t: any }) => {
        const st = TICKET_STATUS[t.status];
        return (
            <div className="rounded-lg border border-border bg-card/50 p-3 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {t.asset && (
                                <span className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3" />
                                    {t.asset.name}
                                </span>
                            )}
                            {t.assignee && <span>→ {t.assignee.name}</span>}
                        </div>
                    </div>
                    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 shrink-0 ${st?.color ?? ''}`}>
                        {st?.label ?? t.status}
                    </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {fmtTime(t.created_at)}
                </p>
            </div>
        );
    };

    const LogItem = ({ log }: { log: any }) => (
        <div className="relative flex items-start gap-3 py-2.5">
            <div className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${LOG_COLORS[log.action] ?? 'bg-zinc-500'}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{LOG_LABELS[log.action] ?? log.action}</p>
                <p className="text-xs text-muted-foreground truncate">{log.description}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground/70">
                    {log.asset && (
                        <span className="flex items-center gap-1">
                            <HardDrive className="h-2.5 w-2.5" />
                            {log.asset.name}
                        </span>
                    )}
                    {log.creator && <span>oleh {log.creator.name}</span>}
                    <span>{fmtTime(log.created_at)}</span>
                </div>
            </div>
        </div>
    );

    const EmptyTickets = () => (
        <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-emerald-400/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Semua bersih!</p>
            <p className="text-xs text-muted-foreground/70">Tidak ada tiket aktif</p>
        </div>
    );

    const EmptyLogs = () => (
        <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
        </div>
    );

    return (
        <>
            <Head title="Monitoring Inventaris IT">
                <meta name="description" content="Dashboard monitoring aset IT secara real-time. Pantau status perangkat, tiket kerusakan, dan aktivitas maintenance." />
            </Head>

            <div className="min-h-screen bg-background text-foreground">
                {/* Header */}
                <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Server className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xs sm:text-sm font-bold tracking-tight">Monitoring Inventaris</h1>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Live Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-400">
                                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="hidden sm:inline">Live</span>
                            </div>
                            {auth?.user ? (
                                <Link
                                    href={dashboard()}
                                    className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors"
                                >
                                    <Monitor className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors"
                                >
                                    <LogIn className="h-3.5 w-3.5" />
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                    {/* ===== MOBILE LAYOUT ===== */}
                    <div className="md:hidden space-y-4">
                        {/* Mobile: Compact Stats Strip */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="rounded-xl bg-card border border-border p-3 text-center">
                                <p className="text-xl font-extrabold">{stats.total_assets}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Aset</p>
                            </div>
                            <div className="rounded-xl bg-card border border-border p-3 text-center">
                                <p className={`text-xl font-extrabold ${healthPct >= 80 ? 'text-emerald-400' : healthPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {healthPct}%
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Sehat</p>
                            </div>
                            <div className="rounded-xl bg-card border border-border p-3 text-center">
                                <p className={`text-xl font-extrabold ${stats.open_tickets > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {stats.open_tickets}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Aktif</p>
                            </div>
                            <div className="rounded-xl bg-card border border-border p-3 text-center">
                                <p className="text-xl font-extrabold text-emerald-400">{stats.done_tickets}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Selesai</p>
                            </div>
                        </div>

                        {/* Mobile: Status Horizontal Bar */}
                        <div className="rounded-xl bg-card border border-border p-3">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Status Aset</p>
                            {/* Stacked bar */}
                            <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-3">
                                {Object.entries(STATUS_LABELS).map(([key]) => {
                                    const count = stats.by_status[key] ?? 0;
                                    const pct = stats.total_assets > 0 ? (count / stats.total_assets) * 100 : 0;
                                    if (pct === 0) return null;
                                    return (
                                        <div
                                            key={key}
                                            className={`h-full bg-gradient-to-r ${STATUS_COLORS[key]} transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                            title={`${STATUS_LABELS[key]}: ${count}`}
                                        />
                                    );
                                })}
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                {Object.entries(STATUS_LABELS).map(([key, label]) => {
                                    const count = stats.by_status[key] ?? 0;
                                    return (
                                        <div key={key} className="flex items-center gap-1.5 text-[11px]">
                                            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[key]}`} />
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-semibold text-foreground">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile: Tab Switcher for Tickets/Activity */}
                        <div className="rounded-xl bg-card border border-border overflow-hidden">
                            <div className="flex border-b border-border">
                                <button
                                    onClick={() => setActiveTab('tickets')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                                        activeTab === 'tickets'
                                            ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/5'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Tiket Aktif
                                    {stats.open_tickets > 0 && (
                                        <span className="bg-amber-500/20 text-amber-400 text-[9px] rounded-full px-1.5 py-0.5 font-bold">
                                            {stats.open_tickets}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                                        activeTab === 'activity'
                                            ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    <Activity className="h-3.5 w-3.5" />
                                    Aktivitas
                                </button>
                            </div>
                            <div className="p-3 max-h-[50vh] overflow-y-auto">
                                {activeTab === 'tickets' ? (
                                    <div className="space-y-2">
                                        {stats.recent_tickets.length === 0 ? <EmptyTickets /> : stats.recent_tickets.map((t: any) => <TicketCard key={t.id} t={t} />)}
                                    </div>
                                ) : (
                                    <div className="relative space-y-0">
                                        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-muted" />
                                        {stats.recent_logs.length === 0 ? <EmptyLogs /> : stats.recent_logs.map((log: any) => <LogItem key={log.id} log={log} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== DESKTOP LAYOUT ===== */}
                    <div className="hidden md:block space-y-8">
                        {/* Desktop Stats Row */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-5">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
                                    <HardDrive className="h-3.5 w-3.5" /> Total Aset
                                </div>
                                <p className="text-4xl font-extrabold tracking-tight">{stats.total_assets}</p>
                                <p className="text-muted-foreground text-xs mt-1">unit terdaftar</p>
                            </div>
                            <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-5">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
                                    <Shield className="h-3.5 w-3.5" /> Kesehatan
                                </div>
                                <p className={`text-4xl font-extrabold tracking-tight ${healthPct >= 80 ? 'text-emerald-400' : healthPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {healthPct}%
                                </p>
                                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${healthPct >= 80 ? 'bg-emerald-400' : healthPct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                                        style={{ width: `${healthPct}%` }}
                                    />
                                </div>
                            </div>
                            <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-5">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Tiket Aktif
                                </div>
                                <p className={`text-4xl font-extrabold tracking-tight ${stats.open_tickets > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {stats.open_tickets}
                                </p>
                                <p className="text-muted-foreground text-xs mt-1">perlu ditangani</p>
                            </div>
                            <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-5">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
                                    <CheckCircle className="h-3.5 w-3.5" /> Terselesaikan
                                </div>
                                <p className="text-4xl font-extrabold tracking-tight text-emerald-400">{stats.done_tickets}</p>
                                <p className="text-muted-foreground text-xs mt-1">dari {stats.total_tickets} total tiket</p>
                            </div>
                        </div>

                        {/* Desktop Status Breakdown */}
                        <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-6">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                                <Cpu className="h-4 w-4 text-blue-400" />
                                Distribusi Status Aset
                            </h2>
                            <div className="grid grid-cols-5 gap-3">
                                {Object.entries(STATUS_LABELS).map(([key, label]) => {
                                    const count = stats.by_status[key] ?? 0;
                                    const Icon = STATUS_ICONS[key] ?? Package;
                                    const pct = stats.total_assets > 0 ? Math.round((count / stats.total_assets) * 100) : 0;
                                    return (
                                        <div key={key} className="rounded-xl border border-border bg-card/50 p-4 hover:bg-accent transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${STATUS_COLORS[key]} flex items-center justify-center`}>
                                                    <Icon className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-lg font-bold">{count}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${STATUS_COLORS[key]} transition-all duration-700`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{pct}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop Two Column */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Active Tickets */}
                            <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    Tiket Aktif
                                    {stats.open_tickets > 0 && (
                                        <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
                                            {stats.open_tickets} aktif
                                        </span>
                                    )}
                                </h2>
                                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                    {stats.recent_tickets.length === 0 ? <EmptyTickets /> : stats.recent_tickets.map((t: any) => <TicketCard key={t.id} t={t} />)}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="rounded-2xl bg-gradient-to-br from-[#141B2D] to-[#1A2340] border border-border p-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                                    <Activity className="h-4 w-4 text-blue-400" />
                                    Aktivitas Terbaru
                                </h2>
                                <div className="space-y-0 relative max-h-[380px] overflow-y-auto pr-1">
                                    <div className="absolute left-[5px] top-2 bottom-2 w-px bg-muted" />
                                    {stats.recent_logs.length === 0 ? <EmptyLogs /> : stats.recent_logs.map((log: any) => <LogItem key={log.id} log={log} />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-border py-4 sm:py-6 mt-4 sm:mt-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground/70">
                        <p>© {new Date().getFullYear()} Rumah Sakit X — Monitoring Inventaris IT</p>
                        <p className="flex items-center gap-1.5">
                            <RefreshCw className="h-3 w-3" />
                            Auto-refresh setiap kunjungan
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

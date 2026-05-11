import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { Activity, Clock, Globe, Monitor, RefreshCw, Server, Signal, SignalZero, Wifi, WifiOff, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { useState, useCallback } from 'react';

interface NetworkAsset {
    id: number; code: string; name: string; ip_address: string;
    status: string; last_heartbeat: string | null;
    agent_data: Record<string, string> | null;
    remote_access_type: string | null; remote_access_id: string | null;
    location: string | null; category: string | null;
}

interface PingResult {
    asset_id: number; ip: string; status: 'online' | 'offline' | 'no_ip';
    latency: number | null; name: string; code: string;
    last_heartbeat?: string | null; location?: string; category?: string;
}

interface Props {
    assets: NetworkAsset[];
    totalWithIp: number; totalWithoutIp: number;
    recentHeartbeats: NetworkAsset[];
    locations: { id: number; name: string }[];
    categories: { id: number; name: string }[];
    filters: { location_id?: string; category_id?: string };
    auth: { user: { role: string } };
}

export default function NetworkMonitor({ assets, totalWithIp, totalWithoutIp, recentHeartbeats, locations, categories, filters }: Props) {
    const [pingResults, setPingResults] = useState<PingResult[]>([]);
    const [isPinging, setIsPinging] = useState(false);
    const [stats, setStats] = useState<{ online: number; offline: number; avg_latency: number } | null>(null);
    const [singlePinging, setSinglePinging] = useState<number | null>(null);

    const pingAll = useCallback(async () => {
        setIsPinging(true);
        try {
            const res = await fetch('/network-monitor/ping-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '' },
                body: JSON.stringify({ location_id: filters.location_id, category_id: filters.category_id }),
            });
            const data = await res.json();
            setPingResults(data.results || []);
            setStats(data.stats || null);
        } catch { } finally { setIsPinging(false); }
    }, [filters]);

    const pingSingle = useCallback(async (assetId: number) => {
        setSinglePinging(assetId);
        try {
            const res = await fetch(`/network-monitor/ping/${assetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '' },
            });
            const data = await res.json();
            setPingResults(prev => {
                const idx = prev.findIndex(r => r.asset_id === assetId);
                const asset = assets.find(a => a.id === assetId);
                const newResult: PingResult = { ...data, name: asset?.name || '', code: asset?.code || '', location: asset?.location, category: asset?.category };
                if (idx >= 0) { const copy = [...prev]; copy[idx] = newResult; return copy; }
                return [...prev, newResult];
            });
        } catch { } finally { setSinglePinging(null); }
    }, [assets]);

    const getResultForAsset = (id: number) => pingResults.find(r => r.asset_id === id);

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Belum pernah';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        return `${Math.floor(hours / 24)} hari lalu`;
    };

    const openRemoteAccess = (type: string | null, id: string | null) => {
        if (!type || !id) return;
        const urls: Record<string, string> = {
            vnc: `vnc://${id}`, rustdesk: `rustdesk://${id}`, anydesk: `anydesk:${id}`,
        };
        if (urls[type]) window.open(urls[type], '_blank');
    };

    return (
        <>
            <Head title="Network Monitor" />
            <div className="space-y-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Activity className="h-6 w-6 text-cyan-500" /> Network Monitor
                        </h1>
                        <p className="text-muted-foreground text-sm">Pantau koneksi jaringan, remote access, dan agent heartbeat</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Select value={filters.location_id || 'all'} onValueChange={v => router.get('/network-monitor', { ...filters, location_id: v === 'all' ? undefined : v }, { preserveState: true, replace: true })}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Semua Lokasi" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Lokasi</SelectItem>
                                {locations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={pingAll} disabled={isPinging} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            <RefreshCw className={`mr-2 h-4 w-4 ${isPinging ? 'animate-spin' : ''}`} />
                            {isPinging ? 'Scanning...' : 'Scan Semua'}
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <Card className="border-cyan-100 bg-cyan-50/30 dark:border-cyan-900/50 dark:bg-cyan-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg"><Globe className="h-5 w-5 text-cyan-600" /></div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total IP</p>
                                    <p className="text-2xl font-bold">{totalWithIp}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg"><Wifi className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Online</p>
                                    <p className="text-2xl font-bold">{stats?.online ?? '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-100 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg"><WifiOff className="h-5 w-5 text-red-600" /></div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Offline</p>
                                    <p className="text-2xl font-bold">{stats?.offline ?? '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-100 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg"><Signal className="h-5 w-5 text-amber-600" /></div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Avg Latency</p>
                                    <p className="text-2xl font-bold">{stats?.avg_latency ? `${stats.avg_latency}ms` : '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-zinc-100 bg-zinc-50/30 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg"><SignalZero className="h-5 w-5 text-zinc-500" /></div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Tanpa IP</p>
                                    <p className="text-2xl font-bold">{totalWithoutIp}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Device List */}
                    <div className="lg:col-span-2">
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span className="flex items-center gap-2"><Server className="h-4 w-4" /> Daftar Perangkat ({assets.length})</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                    {assets.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Tidak ada asset dengan IP address</p>}
                                    {assets.map(asset => {
                                        const result = getResultForAsset(asset.id);
                                        const isOnline = result?.status === 'online';
                                        const isOffline = result?.status === 'offline';
                                        return (
                                            <div key={asset.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                                                <div className={`h-3 w-3 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : isOffline ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-zinc-300'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm truncate cursor-pointer hover:text-cyan-600" onClick={() => router.visit(`/assets/${asset.id}`)}>{asset.name}</p>
                                                        {result && <Badge variant="outline" className={`text-[10px] ${isOnline ? 'bg-emerald-500/15 text-emerald-600 border-emerald-200' : 'bg-red-500/15 text-red-600 border-red-200'}`}>{isOnline ? `${result.latency}ms` : 'Offline'}</Badge>}
                                                    </div>
                                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                                        <code>{asset.ip_address}</code>
                                                        {asset.location && <span>📍 {asset.location}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    {asset.remote_access_type && asset.remote_access_id && (
                                                        <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" title={`Remote: ${asset.remote_access_type}`} onClick={() => openRemoteAccess(asset.remote_access_type, asset.remote_access_id)}>
                                                            <Monitor className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" disabled={singlePinging === asset.id} onClick={() => pingSingle(asset.id)} title="Ping">
                                                        <RefreshCw className={`h-4 w-4 ${singlePinging === asset.id ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel */}
                    <div className="space-y-4">
                        {/* Recent Heartbeats */}
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-cyan-500" /> Agent Heartbeat Terbaru
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {recentHeartbeats.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">Belum ada heartbeat dari agent</p>}
                                    {recentHeartbeats.map(hb => (
                                        <div key={hb.id} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors" onClick={() => router.visit(`/assets/${hb.id}`)}>
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate text-xs">{hb.name}</p>
                                                <p className="text-muted-foreground text-[10px]">{hb.ip_address} · {formatTimeAgo(hb.last_heartbeat)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Agent Info */}
                        {recentHeartbeats.length > 0 && recentHeartbeats[0].agent_data && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Cpu className="h-4 w-4 text-purple-500" /> Detail Agent: {recentHeartbeats[0].name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="space-y-2 text-sm">
                                        {Object.entries(recentHeartbeats[0].agent_data || {}).filter(([k]) => k !== 'collected_at').map(([key, value]) => (
                                            <div key={key} className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground text-xs capitalize">{key.replace(/_/g, ' ')}</dt>
                                                <dd className="text-xs font-medium text-right truncate max-w-[180px]">{value || '—'}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                        {/* Download Agent */}
                        <Card className="border-purple-200/50 bg-purple-50/20 dark:border-purple-900/30 dark:bg-purple-950/10">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MemoryStick className="h-4 w-4 text-purple-500" /> Monitoring Agent
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">Install agent di setiap PC untuk auto-collect hardware data (CPU, RAM, disk, OS) dan kirim heartbeat berkala.</p>
                                <Button variant="outline" className="w-full border-purple-300 text-purple-600 hover:bg-purple-50" onClick={() => window.open('/agent/monitoring-agent.ps1', '_blank')}>
                                    <HardDrive className="mr-2 h-4 w-4" /> Download Agent (PowerShell)
                                </Button>
                                <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-xs font-medium mb-1">Quick Start:</p>
                                    <code className="text-[10px] text-muted-foreground block">powershell -ExecutionPolicy Bypass -File monitoring-agent.ps1</code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

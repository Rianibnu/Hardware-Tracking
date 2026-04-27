import { useState, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet, RefreshCw, Plus, Trash2, ExternalLink, CheckCircle2, XCircle,
    AlertTriangle, Clock, Upload, Settings, Zap, FileSpreadsheet, Link2, Power, Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Google Sheets Sync', href: '/google-sheets' },
];

const SYNC_SHEET_OPTIONS = [
    { value: 'assets', label: 'Inventaris Asset', icon: '📦' },
    { value: 'tickets', label: 'Laporan Kerusakan', icon: '🎫' },
    { value: 'services', label: 'Servis Pihak 3', icon: '🔧' },
    { value: 'summary', label: 'Ringkasan Dashboard', icon: '📊' },
];

interface Config {
    id: number;
    name: string;
    spreadsheet_id: string;
    spreadsheet_url: string;
    sync_sheets: string[];
    auto_sync: boolean;
    sync_interval_minutes: number;
    status: 'active' | 'paused' | 'error';
    last_error: string | null;
    last_synced_at: string | null;
    last_sync_rows: number | null;
    creator?: { id: number; name: string };
    created_at: string;
}

interface SyncLog {
    id: number;
    config_id: number;
    type: 'manual' | 'scheduled' | 'webhook';
    status: 'running' | 'success' | 'failed';
    sheets_synced: string[] | null;
    total_rows: number;
    duration_seconds: number | null;
    error_message: string | null;
    config?: Config;
    triggered_by?: { id: number; name: string } | null;
    created_at: string;
}

export default function GoogleSheetsIndex() {
    const { configs, recentLogs, hasCredentials, flash } = usePage<any>().props;
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [editId, setEditId] = useState<number | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [showCredDialog, setShowCredDialog] = useState(false);
    const [syncing, setSyncing] = useState<number | null>(null);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; title?: string; error?: string } | null>(null);
    const credFileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        spreadsheet_url: '',
        sync_sheets: ['assets', 'tickets'] as string[],
        auto_sync: false,
        sync_interval_minutes: 30,
    });

    const openAddDialog = () => {
        setDialogMode('add');
        setEditId(null);
        reset();
        setTestResult(null);
        setShowDialog(true);
    };

    const openEditDialog = (cfg: Config) => {
        setDialogMode('edit');
        setEditId(cfg.id);
        setData({
            name: cfg.name,
            spreadsheet_url: cfg.spreadsheet_url,
            sync_sheets: cfg.sync_sheets,
            auto_sync: cfg.auto_sync,
            sync_interval_minutes: cfg.sync_interval_minutes,
        });
        setTestResult(null);
        setShowDialog(true);
    };

    const handleSync = (configId: number) => {
        setSyncing(configId);
        router.post(`/google-sheets/${configId}/sync`, {}, {
            onFinish: () => setSyncing(null),
        });
    };

    const handleDelete = (configId: number) => {
        if (confirm('Yakin hapus konfigurasi ini? Data di Google Sheets tidak akan terpengaruh.')) {
            router.delete(`/google-sheets/${configId}`);
        }
    };

    const handleToggleAutoSync = (configId: number) => {
        router.post(`/google-sheets/${configId}/toggle-auto-sync`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (dialogMode === 'add') {
            post('/google-sheets', {
                onSuccess: () => { setShowDialog(false); reset(); setTestResult(null); },
            });
        } else {
            put(`/google-sheets/${editId}`, {
                onSuccess: () => { setShowDialog(false); reset(); setTestResult(null); },
            });
        }
    };

    const handleTestConnection = async () => {
        if (!data.spreadsheet_url) return;
        setTesting(true);
        setTestResult(null);
        try {
            const csrf = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/google-sheets/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf || '' },
                body: JSON.stringify({ spreadsheet_url: data.spreadsheet_url }),
            });
            const result = await res.json();
            setTestResult(result);
        } catch { setTestResult({ success: false, error: 'Gagal menghubungi server.' }); }
        setTesting(false);
    };

    const handleUploadCredentials = () => {
        const file = credFileRef.current?.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('credentials', file);
        router.post('/google-sheets/upload-credentials', fd as any, {
            forceFormData: true,
            onFinish: () => { setShowCredDialog(false); if (credFileRef.current) credFileRef.current.value = ''; },
        });
    };

    const toggleSyncSheet = (value: string) => {
        setData('sync_sheets',
            data.sync_sheets.includes(value)
                ? data.sync_sheets.filter(s => s !== value)
                : [...data.sync_sheets, value]
        );
    };

    const statusBadge = (status: string) => {
        const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            active: { variant: 'default', label: 'Aktif' },
            paused: { variant: 'secondary', label: 'Dijeda' },
            error: { variant: 'destructive', label: 'Error' },
            running: { variant: 'outline', label: 'Berjalan...' },
            success: { variant: 'default', label: 'Berhasil' },
            failed: { variant: 'destructive', label: 'Gagal' },
        };
        const s = map[status] ?? { variant: 'outline' as const, label: status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    const fmtTime = (d: string | null) => {
        if (!d) return '-';
        try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: idLocale }); } catch { return d; }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <Head title="Google Sheets Sync" />
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                            Google Sheets Sync
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Sinkronisasi data inventaris secara otomatis ke Google Sheets untuk monitoring real-time.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowCredDialog(true)}>
                            <Settings className="mr-1.5 h-4 w-4" />
                            {hasCredentials ? 'Update' : 'Setup'} Credentials
                        </Button>
                        <Button size="sm" onClick={() => openAddDialog()} disabled={!hasCredentials}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="mr-1.5 h-4 w-4" />
                            Tambah Koneksi
                        </Button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />{flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                        <XCircle className="h-4 w-4 shrink-0" />{flash.error}
                    </div>
                )}

                {/* Credentials Warning */}
                {!hasCredentials && (
                    <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                <div className="space-y-2">
                                    <p className="font-medium text-amber-800 dark:text-amber-300">Setup Diperlukan</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        Untuk menggunakan fitur ini, Anda perlu:
                                    </p>
                                    <ol className="text-sm text-amber-700 dark:text-amber-400 list-decimal ml-4 space-y-1">
                                        <li>Buat project di <a href="https://console.cloud.google.com" target="_blank" className="underline font-medium">Google Cloud Console</a></li>
                                        <li>Aktifkan <strong>Google Sheets API</strong></li>
                                        <li>Buat <strong>Service Account</strong> dan download file credentials JSON</li>
                                        <li>Upload file credentials di tombol "Setup Credentials" di atas</li>
                                        <li>Share spreadsheet Google Sheets ke email service account</li>
                                    </ol>
                                    <Button size="sm" variant="outline" onClick={() => setShowCredDialog(true)}
                                        className="border-amber-400 text-amber-700 hover:bg-amber-100">
                                        <Upload className="mr-1.5 h-4 w-4" />Upload Credentials
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Active Connections */}
                <div className="grid gap-4">
                    {(configs as Config[]).length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Link2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-medium mb-1">Belum Ada Koneksi</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Hubungkan spreadsheet Google Sheets untuk mulai sinkronisasi data.
                                </p>
                                <Button size="sm" onClick={() => openAddDialog()} disabled={!hasCredentials}>
                                    <Plus className="mr-1.5 h-4 w-4" />Tambah Koneksi
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (configs as Config[]).map((cfg) => (
                        <Card key={cfg.id} className={cfg.status === 'error' ? 'border-red-300 dark:border-red-800' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 min-w-0">
                                        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                                            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span className="truncate">{cfg.name}</span>
                                            {statusBadge(cfg.status)}
                                            {cfg.auto_sync && (
                                                <Badge variant="outline" className="text-xs gap-1">
                                                    <Zap className="h-3 w-3" />Auto {cfg.sync_interval_minutes}m
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1.5 text-xs">
                                            <span className="font-mono truncate max-w-xs">{cfg.spreadsheet_id}</span>
                                            <a href={cfg.spreadsheet_url} target="_blank" className="text-blue-500 hover:text-blue-600">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => handleToggleAutoSync(cfg.id)}
                                            title={cfg.auto_sync ? 'Nonaktifkan auto-sync' : 'Aktifkan auto-sync'}>
                                            <Power className={`h-4 w-4 ${cfg.auto_sync ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => openEditDialog(cfg)} title="Edit konfigurasi">
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleSync(cfg.id)}
                                            disabled={syncing === cfg.id}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            {syncing === cfg.id
                                                ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Syncing...</>
                                                : <><RefreshCw className="mr-1.5 h-4 w-4" />Sync Sekarang</>}
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(cfg.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Data yang disync</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {cfg.sync_sheets?.map(s => {
                                                const opt = SYNC_SHEET_OPTIONS.find(o => o.value === s);
                                                return <Badge key={s} variant="secondary" className="text-xs">{opt?.icon} {opt?.label ?? s}</Badge>;
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Terakhir sync</p>
                                        <p className="font-medium mt-1">{fmtTime(cfg.last_synced_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Total baris</p>
                                        <p className="font-medium mt-1">{cfg.last_sync_rows ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Dibuat oleh</p>
                                        <p className="font-medium mt-1">{cfg.creator?.name ?? '-'}</p>
                                    </div>
                                </div>
                                {cfg.last_error && (
                                    <div className="mt-3 p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600 dark:text-red-400">
                                        <strong>Error:</strong> {cfg.last_error}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Sync History */}
                {(recentLogs as SyncLog[]).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />Riwayat Sinkronisasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Konfigurasi</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Baris</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Oleh</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(recentLogs as SyncLog[]).map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs whitespace-nowrap">{fmtTime(log.created_at)}</TableCell>
                                            <TableCell className="font-medium text-sm">{log.config?.name ?? '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {log.type === 'manual' ? '🖱️ Manual' : log.type === 'scheduled' ? '⏰ Terjadwal' : '🔗 Webhook'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{statusBadge(log.status)}</TableCell>
                                            <TableCell className="font-mono text-sm">{log.total_rows}</TableCell>
                                            <TableCell className="text-sm">{log.duration_seconds ? `${log.duration_seconds}s` : '-'}</TableCell>
                                            <TableCell className="text-sm">{log.triggered_by?.name ?? 'System'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Add/Edit Connection Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {dialogMode === 'add' ? <Plus className="h-5 w-5 text-emerald-600" /> : <Settings className="h-5 w-5 text-emerald-600" />}
                            {dialogMode === 'add' ? 'Tambah Koneksi Google Sheets' : 'Edit Koneksi Google Sheets'}
                        </DialogTitle>
                        <DialogDescription>Hubungkan spreadsheet untuk sinkronisasi data inventaris secara otomatis.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Nama Koneksi</Label>
                            <Input placeholder="contoh: Sync Inventaris Utama" value={data.name}
                                onChange={e => setData('name', e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>URL / ID Spreadsheet</Label>
                            <div className="flex gap-2">
                                <Input placeholder="https://docs.google.com/spreadsheets/d/..." value={data.spreadsheet_url} disabled={dialogMode === 'edit'}
                                    onChange={e => { setData('spreadsheet_url', e.target.value); setTestResult(null); }} required className="flex-1" />
                                <Button type="button" variant="outline" size="sm" onClick={handleTestConnection}
                                    disabled={testing || !data.spreadsheet_url}>
                                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                                </Button>
                            </div>
                            {testResult && (
                                <p className={`text-xs ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {testResult.success ? `✓ Terhubung: "${testResult.title}"` : `✗ ${testResult.error}`}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Data yang Disinkronkan</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {SYNC_SHEET_OPTIONS.map(opt => (
                                    <label key={opt.value}
                                        className="flex items-center gap-2 rounded-md border p-2.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Checkbox checked={data.sync_sheets.includes(opt.value)}
                                            onCheckedChange={() => toggleSyncSheet(opt.value)} />
                                        <span>{opt.icon} {opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <p className="text-sm font-medium">Auto Sync</p>
                                <p className="text-xs text-muted-foreground">Sinkronisasi otomatis secara berkala</p>
                            </div>
                            <Checkbox checked={data.auto_sync} onCheckedChange={(v) => setData('auto_sync', !!v)} />
                        </div>
                        {data.auto_sync && (
                            <div className="space-y-1.5">
                                <Label>Interval (menit)</Label>
                                <Select value={String(data.sync_interval_minutes)} onValueChange={v => setData('sync_interval_minutes', Number(v))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 menit</SelectItem>
                                        <SelectItem value="15">15 menit</SelectItem>
                                        <SelectItem value="30">30 menit</SelectItem>
                                        <SelectItem value="60">1 jam</SelectItem>
                                        <SelectItem value="360">6 jam</SelectItem>
                                        <SelectItem value="720">12 jam</SelectItem>
                                        <SelectItem value="1440">24 jam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => { setShowDialog(false); reset(); setTestResult(null); }}>Batal</Button>
                            <Button type="submit" disabled={processing || data.sync_sheets.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {processing ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Menyimpan...</> : (dialogMode === 'add' ? 'Simpan & Hubungkan' : 'Simpan Perubahan')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Credentials Upload Dialog */}
            <Dialog open={showCredDialog} onOpenChange={setShowCredDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />Upload Google Credentials
                        </DialogTitle>
                        <DialogDescription>Upload file JSON credentials dari Google Cloud Console Service Account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-700 dark:text-blue-400 space-y-1">
                            <p className="font-medium">Cara mendapatkan credentials:</p>
                            <ol className="list-decimal ml-4 space-y-0.5">
                                <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a></li>
                                <li>Buat Service Account baru</li>
                                <li>Klik "Keys" → "Add Key" → "Create new key" → JSON</li>
                                <li>Upload file yang ter-download di sini</li>
                            </ol>
                        </div>
                        <Input ref={credFileRef} type="file" accept=".json" />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCredDialog(false)}>Batal</Button>
                            <Button onClick={handleUploadCredentials}>
                                <Upload className="mr-1.5 h-4 w-4" />Upload
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

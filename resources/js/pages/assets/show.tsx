import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import type { Asset, AssetLog, AssetStatus, PaginatedResponse, Ticket } from '@/types/inventory';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, ArrowRightLeft, CheckCircle, Clock, Download, Edit, ExternalLink, FileText, History, MapPin, Package, Printer, RefreshCw, Tag, Trash2, Users, Wrench } from 'lucide-react';
import QRCodeModule from 'react-qr-code';
const QRCode = typeof QRCodeModule === 'function' ? QRCodeModule : (QRCodeModule as any).default;

const STATUS_COLORS: Record<AssetStatus, string> = {
    available: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    in_use: 'bg-blue-500/15 text-blue-600 border-blue-200',
    maintenance: 'bg-amber-500/15 text-amber-600 border-amber-200',
    broken: 'bg-red-500/15 text-red-600 border-red-200',
    disposed: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
};

const STATUS_LABELS: Record<AssetStatus, string> = {
    available: 'Tersedia',
    in_use: 'Digunakan',
    maintenance: 'Maintenance',
    broken: 'Rusak',
    disposed: 'Dibuang',
};

const TICKET_STATUS_COLORS: Record<string, string> = {
    open: 'bg-red-500/15 text-red-600 border-red-200',
    progress: 'bg-amber-500/15 text-amber-600 border-amber-200',
    done: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    closed: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
};

interface Props {
    asset: Asset & {
        tickets?: Ticket[];
        service_records?: any[];
    };
    logs: PaginatedResponse<AssetLog>;
    locations: { id: number; name: string; building?: string; floor?: string; room?: string }[];
    auth: { user: { role: string } };
    appUrl: string;
}

export default function AssetShow({ asset, logs, locations, auth, appUrl }: Props) {
    const isAdmin = auth.user.role === 'admin';
    const isTeknisi = auth.user.role === 'teknisi';

    const activeService = asset.service_records?.find(s => s.status === 'in_progress');

    const [serviceCost, setServiceCost] = useState('0');
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [isMutasiOpen, setIsMutasiOpen] = useState(false);
    const [mutasiLocationId, setMutasiLocationId] = useState('');
    const [mutasiReason, setMutasiReason] = useState('');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');



    const qrPublic = `${appUrl}/scan/${asset.code}`;
    const qrTeknisi = `${appUrl}/assets/${asset.id}`;

    const downloadQrPdf = async (selector: string, label: string, filename: string) => {
        const { jsPDF } = await import('jspdf');
        const svg = document.querySelector(selector) as SVGElement;
        if (!svg) return;

        // Convert SVG to PNG via canvas
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 600;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 600, 600);
            ctx.drawImage(img, 0, 0, 600, 600);
            const pngData = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);

            // Build PDF (80mm x 80mm label)
            const doc = new jsPDF({ unit: 'mm', format: [80, 80] });

            // Title
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(label, 40, 7, { align: 'center' });

            // QR image
            doc.addImage(pngData, 'PNG', 10, 10, 60, 60);

            // Asset name
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(asset.name, 40, 74, { align: 'center' });

            // Asset code
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(asset.code, 40, 78, { align: 'center' });

            doc.save(filename);
        };
        img.src = url;
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/assets')} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold truncate">{asset.name}</h1>
                            <Badge variant="outline" className={`whitespace-nowrap ${activeService ? 'bg-amber-500/15 text-amber-600 border-amber-200' : STATUS_COLORS[asset.status]}`}>
                                {activeService ? 'Sedang Diservis' : STATUS_LABELS[asset.status]}
                            </Badge>
                        </div>
                        <code className="text-muted-foreground text-xs md:text-sm block truncate">{asset.code}</code>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                        <Button variant="outline" onClick={() => router.visit(`/assets/${asset.id}/edit`)} className="flex-1 md:flex-none">
                            <Edit className="mr-2 h-4 w-4" />
                            <span className="md:inline">Edit</span>
                        </Button>
                    )}
                    {isAdmin && (
                        <Dialog open={isMutasiOpen} onOpenChange={setIsMutasiOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 md:flex-none border-purple-300 text-purple-600 hover:bg-purple-50">
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Mutasi
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Mutasi Asset</DialogTitle>
                                    <DialogDescription>
                                        Pindahkan <strong>{asset.name}</strong> dari <strong>{asset.location?.name}</strong> ke lokasi baru.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Lokasi Tujuan</Label>
                                        <Select value={mutasiLocationId} onValueChange={setMutasiLocationId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih lokasi tujuan..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations
                                                    .filter(l => l.id !== asset.location_id)
                                                    .map(l => (
                                                        <SelectItem key={l.id} value={l.id.toString()}>
                                                            {l.name}
                                                            {l.building && ` — ${l.building}`}
                                                            {l.floor && ` Lt.${l.floor}`}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alasan Mutasi (opsional)</Label>
                                        <Textarea
                                            placeholder="Contoh: Pindah karena renovasi ruangan..."
                                            value={mutasiReason}
                                            onChange={e => setMutasiReason(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsMutasiOpen(false)}>Batal</Button>
                                    <Button
                                        disabled={!mutasiLocationId}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => {
                                            router.post(`/assets/${asset.id}/mutate`, {
                                                location_id: mutasiLocationId,
                                                reason: mutasiReason,
                                            }, {
                                                onSuccess: () => {
                                                    setIsMutasiOpen(false);
                                                    setMutasiLocationId('');
                                                    setMutasiReason('');
                                                },
                                            });
                                        }}
                                    >
                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                        Mutasi Sekarang
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                    {(auth.user.role === 'teknisi' || isAdmin) && (
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:flex-none"
                            onClick={() => {
                                if(confirm('Mulai kerjakan aset ini sekarang? Ticket baru akan otomatis dibuat dan di-assign ke Anda.')) {
                                    router.post(`/assets/${asset.id}/quick-maintenance`);
                                }
                            }}
                        >
                            <Wrench className="mr-2 h-4 w-4" />
                            <span className="md:inline">Kerjakan</span>
                        </Button>
                    )}
                    <Button className="flex-1 md:flex-none" onClick={() => router.visit(`/tickets/create?asset_id=${asset.id}`)}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        <span className="md:inline">Laporkan</span>
                    </Button>
                    {isAdmin && (
                        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 md:flex-none border-red-300 text-red-600 hover:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-red-600">Hapus Asset</DialogTitle>
                                    <DialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Asset <strong>{asset.name}</strong> ({asset.code}) akan dihapus permanen beserta semua log-nya.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4">
                                    <Label>Ketik <strong>{asset.code}</strong> untuk konfirmasi:</Label>
                                    <Input
                                        placeholder={asset.code}
                                        value={deleteConfirm}
                                        onChange={e => setDeleteConfirm(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeleteConfirm(''); }}>Batal</Button>
                                    <Button
                                        variant="destructive"
                                        disabled={deleteConfirm !== asset.code}
                                        onClick={() => {
                                            router.delete(`/assets/${asset.id}`, {
                                                onSuccess: () => router.visit('/assets'),
                                            });
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus Permanen
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Info + QR */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Third-party Service Active */}
                    {activeService && (
                        <Card className="border-amber-500/20 bg-amber-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                                    <ExternalLink className="h-4 w-4" />
                                    Sedang Diservis (Pihak Ke-3)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Vendor:</span> {activeService.vendor_name}
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Deskripsi:</span> {activeService.service_description}
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Est. Selesai:</span>{' '}
                                    {activeService.estimated_completion_date
                                        ? new Date(activeService.estimated_completion_date).toLocaleDateString('id-ID')
                                        : 'Tidak ada'}
                                </div>
                                {(isAdmin || isTeknisi) && (
                                    <div className="pt-2">
                                        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full text-amber-600 hover:text-amber-700">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Tandai Servis Selesai
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Selesaikan Servis Pihak Ketiga</DialogTitle>
                                                    <DialogDescription>
                                                        Masukkan biaya perbaikan dari vendor (biarkan 0 jika tidak ada biaya).
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="cost">Biaya (Rp)</Label>
                                                        <Input
                                                            id="cost"
                                                            type="number"
                                                            value={serviceCost}
                                                            onChange={(e) => setServiceCost(e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Batal</Button>
                                                    <Button onClick={() => {
                                                        router.post(`/services/${activeService.id}/complete`, { cost: serviceCost, note: 'Diselesaikan dari halaman aset' }, {
                                                            onSuccess: () => {
                                                                setIsServiceDialogOpen(false);
                                                                router.reload();
                                                            },
                                                            onError: (err) => {
                                                                console.error('Validation errors:', err);
                                                                toast.error('Gagal: ' + Object.values(err).join(', '));
                                                            }
                                                        });
                                                    }}>
                                                        Konfirmasi Selesai
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}


                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4" />
                                Informasi Asset
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                {[
                                    { label: 'Kode', value: asset.code },
                                    { label: 'Nama', value: asset.name },
                                    { label: 'Kategori', value: asset.category?.name ?? '—' },
                                    { label: 'Serial Number', value: asset.serial_number ?? '—' },
                                    { label: 'Brand', value: asset.brand?.name ?? '—' },
                                    { label: 'Model', value: asset.model ?? '—' },
                                    { label: 'Tahun Beli', value: asset.purchase_year?.toString() ?? '—' },
                                    { label: 'Status', value: activeService ? 'Sedang Diservis (Pihak Ke-3)' : STATUS_LABELS[asset.status] },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <dt className="text-muted-foreground font-medium">{label}</dt>
                                        <dd className="mt-0.5 font-medium">{value}</dd>
                                    </div>
                                ))}

                            </dl>
                            {asset.notes && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <dt className="text-muted-foreground text-sm font-medium">Catatan</dt>
                                        <dd className="mt-1 text-sm">{asset.notes}</dd>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4" />
                                Lokasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{asset.location?.name ?? '—'}</p>
                            {asset.location?.building && (
                                <p className="text-muted-foreground text-sm">
                                    {asset.location.building}
                                    {asset.location.floor && ` · Lantai ${asset.location.floor}`}
                                    {asset.location.room && ` · ${asset.location.room}`}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* ═══════ UNIFIED ACTIVITY TIMELINE ═══════ */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="h-4 w-4" />
                                Riwayat Lengkap Aset
                            </CardTitle>
                            <p className="text-muted-foreground text-xs">Semua aktivitas: ticket, servis pihak ketiga, perpindahan, dan perubahan status.</p>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                // Build unified timeline entries
                                type TimelineEntry = {
                                    id: string;
                                    date: Date;
                                    type: 'ticket' | 'service' | 'log';
                                    icon: typeof AlertTriangle;
                                    color: string;
                                    dotColor: string;
                                    title: string;
                                    description: string;
                                    meta?: string;
                                    badge?: { label: string; className: string };
                                    onClick?: () => void;
                                };

                                const entries: TimelineEntry[] = [];

                                const TICKET_LABELS: Record<string, string> = {
                                    open: 'Terbuka', progress: 'Dikerjakan', done: 'Selesai', closed: 'Ditutup',
                                };

                                // Tickets
                                (asset.tickets ?? []).forEach((t: any) => {
                                    entries.push({
                                        id: `ticket-${t.id}`,
                                        date: new Date(t.created_at),
                                        type: 'ticket',
                                        icon: AlertTriangle,
                                        color: 'text-red-500',
                                        dotColor: 'bg-red-500',
                                        title: t.title,
                                        description: `Tiket #${t.id} dilaporkan${t.reporter ? ' oleh ' + t.reporter.name : ''}`,
                                        meta: t.assignee ? `Ditugaskan ke ${t.assignee.name}` : undefined,
                                        badge: {
                                            label: TICKET_LABELS[t.status] ?? t.status,
                                            className: TICKET_STATUS_COLORS[t.status] ?? '',
                                        },
                                        onClick: () => router.visit(`/tickets/${t.id}`),
                                    });
                                });

                                // Service Records
                                (asset.service_records ?? []).forEach((s: any) => {
                                    entries.push({
                                        id: `service-${s.id}`,
                                        date: new Date(s.created_at),
                                        type: 'service',
                                        icon: ExternalLink,
                                        color: 'text-amber-500',
                                        dotColor: 'bg-amber-500',
                                        title: `Servis Pihak Ke-3: ${s.vendor_name}`,
                                        description: s.service_description || 'Dikirim ke vendor untuk perbaikan',
                                        meta: s.cost && Number(s.cost) > 0
                                            ? `Biaya: Rp ${Number(s.cost).toLocaleString('id-ID')}`
                                            : undefined,
                                        badge: {
                                            label: s.status === 'completed' ? 'Selesai' : 'Proses',
                                            className: s.status === 'completed'
                                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-200'
                                                : 'bg-amber-500/15 text-amber-600 border-amber-200',
                                        },
                                        onClick: s.ticket_id ? () => router.visit(`/tickets/${s.ticket_id}`) : undefined,
                                    });
                                    if (s.completed_at) {
                                        entries.push({
                                            id: `service-done-${s.id}`,
                                            date: new Date(s.completed_at),
                                            type: 'service',
                                            icon: CheckCircle,
                                            color: 'text-emerald-500',
                                            dotColor: 'bg-emerald-500',
                                            title: `Servis selesai: ${s.vendor_name}`,
                                            description: s.cost && Number(s.cost) > 0
                                                ? `Diselesaikan dengan biaya Rp ${Number(s.cost).toLocaleString('id-ID')}`
                                                : 'Diselesaikan',
                                        });
                                    }
                                });

                                // Asset Logs
                                const LOG_ICONS: Record<string, typeof Package> = {
                                    create: Package, update: RefreshCw, move: MapPin,
                                    status_change: RefreshCw, maintenance: Wrench,
                                };
                                const LOG_COLORS: Record<string, string> = {
                                    create: 'text-emerald-500', update: 'text-blue-500',
                                    move: 'text-purple-500', status_change: 'text-orange-500',
                                    maintenance: 'text-amber-500',
                                };
                                const LOG_DOT_COLORS: Record<string, string> = {
                                    create: 'bg-emerald-500', update: 'bg-blue-500',
                                    move: 'bg-purple-500', status_change: 'bg-orange-500',
                                    maintenance: 'bg-amber-500',
                                };
                                const LOG_LABELS: Record<string, string> = {
                                    create: 'Aset Dibuat', update: 'Data Diperbarui',
                                    move: 'Dipindahkan', status_change: 'Status Berubah',
                                    maintenance: 'Maintenance',
                                };

                                (logs?.data ?? []).forEach((log: any) => {
                                    let description = log.description || LOG_LABELS[log.action] || log.action;
                                    // Parse metadata for richer info
                                    if (log.metadata) {
                                        const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                                        if (log.action === 'status_change' && meta.from && meta.to) {
                                            const from = STATUS_LABELS[meta.from as AssetStatus] ?? meta.from;
                                            const to = STATUS_LABELS[meta.to as AssetStatus] ?? meta.to;
                                            description = `Status berubah: ${from} → ${to}`;
                                        }
                                        if (log.action === 'move' && meta.from && meta.to) {
                                            description = `Dipindah dari "${meta.from}" ke "${meta.to}"`;
                                        }
                                    }

                                    entries.push({
                                        id: `log-${log.id}`,
                                        date: new Date(log.created_at),
                                        type: 'log',
                                        icon: LOG_ICONS[log.action] ?? FileText,
                                        color: LOG_COLORS[log.action] ?? 'text-zinc-500',
                                        dotColor: LOG_DOT_COLORS[log.action] ?? 'bg-zinc-400',
                                        title: LOG_LABELS[log.action] ?? log.action,
                                        description,
                                        meta: log.creator ? `oleh ${log.creator.name}` : undefined,
                                    });
                                });

                                // Sort by date descending
                                entries.sort((a, b) => b.date.getTime() - a.date.getTime());

                                if (entries.length === 0) {
                                    return (
                                        <p className="text-muted-foreground text-center py-8 text-sm">
                                            Belum ada aktivitas tercatat untuk aset ini.
                                        </p>
                                    );
                                }

                                return (
                                    <div className="relative max-h-[500px] overflow-y-auto pr-2">
                                        {/* Timeline line */}
                                        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />

                                        <div className="space-y-0">
                                            {entries.map((entry, i) => {
                                                const Icon = entry.icon;
                                                const showDateHeader = i === 0 ||
                                                    entry.date.toLocaleDateString('id-ID') !== entries[i - 1].date.toLocaleDateString('id-ID');

                                                return (
                                                    <div key={entry.id}>
                                                        {showDateHeader && (
                                                            <div className="flex items-center gap-2 py-2 pl-8">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                                    {entry.date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`relative flex items-start gap-3 py-2.5 pl-0 group ${entry.onClick ? 'cursor-pointer' : ''}`}
                                                            onClick={entry.onClick}
                                                        >
                                                            {/* Dot */}
                                                            <div className={`relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-background flex items-center justify-center ${entry.dotColor}`}>
                                                                <Icon className="h-3 w-3 text-white" />
                                                            </div>

                                                            {/* Content */}
                                                            <div className={`flex-1 rounded-lg border p-3 transition-colors ${entry.onClick ? 'group-hover:bg-muted/50 group-hover:border-primary/30' : ''}`}>
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium">{entry.title}</p>
                                                                        <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                                                                        {entry.meta && (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">{entry.meta}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {entry.badge && (
                                                                            <Badge variant="outline" className={`text-[10px] ${entry.badge.className}`}>
                                                                                {entry.badge.label}
                                                                            </Badge>
                                                                        )}
                                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                                            {entry.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>

                {/* QR Code Panel */}
                <div className="space-y-4">
                    {/* QR Public */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4 text-emerald-500" />
                                QR Publik
                            </CardTitle>
                            <p className="text-muted-foreground text-xs">Untuk pelaporan masalah tanpa login</p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-3">
                            <div className="bg-white rounded-xl p-3 shadow-sm border-2 border-emerald-200">
                                <QRCode
                                    value={qrPublic}
                                    size={150}
                                    className="qr-public"
                                />
                            </div>
                            <p className="text-muted-foreground text-xs break-all text-center">{qrPublic}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => downloadQrPdf('.qr-public', 'QR PUBLIK - Lapor Masalah', `QR-Public-${asset.code}.pdf`)}
                            >
                                <Printer className="mr-2 h-3 w-3" />
                                Print QR Publik
                            </Button>
                        </CardContent>
                    </Card>

                    {/* QR Teknisi */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wrench className="h-4 w-4 text-blue-500" />
                                QR Teknisi
                            </CardTitle>
                            <p className="text-muted-foreground text-xs">Langsung ke detail aset (perlu login)</p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-3">
                            <div className="bg-white rounded-xl p-3 shadow-sm border-2 border-blue-200">
                                <QRCode
                                    value={qrTeknisi}
                                    size={150}
                                    className="qr-teknisi"
                                />
                            </div>
                            <p className="text-muted-foreground text-xs break-all text-center">{qrTeknisi}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => downloadQrPdf('.qr-teknisi', 'QR TEKNISI - Internal', `QR-Teknisi-${asset.code}.pdf`)}
                            >
                                <Printer className="mr-2 h-3 w-3" />
                                Print QR Teknisi
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

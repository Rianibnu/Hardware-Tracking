import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Asset, AssetStatus, Consumable } from '@/types/inventory';
import { useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, MapPin, Package, Send, Boxes } from 'lucide-react';
import React, { FormEvent, useState } from 'react';

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

interface Props {
    asset: Asset;
    consumables: Consumable[];
}

export default function PublicShow({ asset, consumables }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    
    const ticketForm = useForm({
        reporter_name: '',
        title: '',
        description: '',
        priority: 'medium',
    });

    const reqForm = useForm({
        consumable_id: '',
        quantity: '1',
        public_requester_name: '',
        public_requester_email: '',
        location_id: asset.location_id ? String(asset.location_id) : '',
        reason: `Permintaan dari QR Asset: ${asset.name} (${asset.code})`,
    });

    const submitTicket = (e: FormEvent) => {
        e.preventDefault();
        ticketForm.post(`/public/assets/${asset.code}/tickets`, {
            preserveScroll: true,
            onSuccess: () => ticketForm.reset(),
        });
    };

    const submitReq = (e: FormEvent) => {
        e.preventDefault();
        reqForm.post(`/public/consumables/request`, {
            preserveScroll: true,
            onSuccess: () => reqForm.reset('consumable_id', 'quantity', 'reason'),
        });
    };

    // Find selected consumable to show its unit
    const selectedConsumable = consumables.find(c => String(c.id) === reqForm.data.consumable_id);

    return (
        <div className="min-h-screen bg-background text-foreground pb-12">
            <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{asset.name}</h1>
                        <Badge variant="outline" className={STATUS_COLORS[asset.status]}>
                            {STATUS_LABELS[asset.status]}
                        </Badge>
                    </div>
                    <code className="text-muted-foreground text-sm">{asset.code}</code>
                </div>

                {flash?.success && (
                    <div className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 rounded-lg border p-4 text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-destructive/15 text-destructive border-destructive/20 rounded-lg border p-4 text-sm font-medium">
                        {flash.error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Info Column */}
                    <div className="space-y-6">
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
                                        { label: 'Kategori', value: asset.category?.name ?? '—' },
                                        { label: 'Brand', value: asset.brand?.name ?? '—' },
                                        { label: 'Model', value: asset.model ?? '—' },
                                        { label: 'Tahun Beli', value: asset.purchase_year?.toString() ?? '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label}>
                                            <dt className="text-muted-foreground font-medium">{label}</dt>
                                            <dd className="mt-0.5 font-medium">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="h-4 w-4" />
                                    Lokasi Saat Ini
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
                    </div>

                    {/* Forms Column */}
                    <div className="space-y-6">
                        {/* Request Consumable Form */}
                        <Card className="border-indigo-500/20 shadow-sm overflow-hidden">
                            <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 pb-4">
                                <CardTitle className="flex items-center gap-2 text-base text-indigo-600 dark:text-indigo-400">
                                    <Boxes className="h-5 w-5" />
                                    Minta Barang Habis Pakai
                                </CardTitle>
                                <CardDescription className="text-foreground/80">
                                    Butuh tinta printer, kertas, atau kabel untuk alat ini?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={submitReq} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="req_name">Nama Anda <span className="text-red-500">*</span></Label>
                                        <Input id="req_name" required placeholder="Masukkan nama Anda" value={reqForm.data.public_requester_name} onChange={e => reqForm.setData('public_requester_name', e.target.value)} disabled={reqForm.processing} />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Pilih Barang <span className="text-red-500">*</span></Label>
                                        <Select required value={reqForm.data.consumable_id} onValueChange={v => reqForm.setData('consumable_id', v)} disabled={reqForm.processing}>
                                            <SelectTrigger><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
                                            <SelectContent>
                                                {consumables.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.current_stock > 0 ? `${c.current_stock} tersedia` : 'Habis'})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Jumlah <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Input type="number" min="1" required className="pr-12" value={reqForm.data.quantity} onChange={e => reqForm.setData('quantity', e.target.value)} disabled={reqForm.processing} />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <span className="text-muted-foreground text-sm">{selectedConsumable?.unit ?? ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={reqForm.processing}>
                                        {reqForm.processing ? 'Mengirim...' : (
                                            <><Send className="mr-2 h-4 w-4" /> Ajukan Permintaan</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Report Form */}
                        <Card className="border-destructive/20 shadow-sm overflow-hidden">
                            <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-4">
                                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Laporkan Kerusakan
                                </CardTitle>
                                <CardDescription className="text-foreground/80">
                                    Alat ini tidak berfungsi? Laporkan ke tim IT.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={submitTicket} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reporter_name">Nama Pelapor <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="reporter_name"
                                            placeholder="Masukkan nama Anda"
                                            value={ticketForm.data.reporter_name}
                                            onChange={(e) => ticketForm.setData('reporter_name', e.target.value)}
                                            disabled={ticketForm.processing}
                                        />
                                        {ticketForm.errors.reporter_name && <p className="text-sm text-red-500">{ticketForm.errors.reporter_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">Judul Masalah <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="title"
                                            placeholder="Contoh: AC tidak dingin"
                                            value={ticketForm.data.title}
                                            onChange={(e) => ticketForm.setData('title', e.target.value)}
                                            disabled={ticketForm.processing}
                                        />
                                        {ticketForm.errors.title && <p className="text-sm text-red-500">{ticketForm.errors.title}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Deskripsi Detail <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Jelaskan masalah secara detail..."
                                            value={ticketForm.data.description}
                                            onChange={(e) => ticketForm.setData('description', e.target.value)}
                                            className="min-h-[100px]"
                                            disabled={ticketForm.processing}
                                        />
                                        {ticketForm.errors.description && <p className="text-sm text-red-500">{ticketForm.errors.description}</p>}
                                    </div>

                                    <Button type="submit" variant="destructive" className="w-full" disabled={ticketForm.processing}>
                                        {ticketForm.processing ? 'Mengirim...' : (
                                            <><Send className="mr-2 h-4 w-4" /> Kirim Laporan</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

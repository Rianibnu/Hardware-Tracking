import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Asset, AssetStatus } from '@/types/inventory';
import { useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, MapPin, Package, Send } from 'lucide-react';
import React, { FormEvent } from 'react';

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
}

export default function PublicShow({ asset }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        reporter_name: '',
        title: '',
        description: '',
        priority: 'medium',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/public/assets/${asset.code}/tickets`, {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
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
                    {/* Info */}
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
                    </div>

                    {/* Report Form */}
                    <Card className="border-destructive/20 shadow-sm overflow-hidden">
                        <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Laporkan Masalah
                            </CardTitle>
                            <CardDescription className="text-foreground/80">
                                Temukan masalah pada asset ini? Laporkan langsung ke tim IT tanpa perlu login.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reporter_name">Nama Pelapor <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="reporter_name"
                                        placeholder="Masukkan nama Anda"
                                        value={data.reporter_name}
                                        onChange={(e) => setData('reporter_name', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.reporter_name && <p className="text-sm text-red-500">{errors.reporter_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Judul Masalah <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="Contoh: AC tidak dingin"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Deskripsi Detail <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Jelaskan masalah secara detail..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="min-h-[100px]"
                                        disabled={processing}
                                    />
                                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Tingkat Prioritas</Label>
                                    <Select value={data.priority} onValueChange={(v) => setData('priority', v)} disabled={processing}>
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Pilih prioritas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Rendah (Low)</SelectItem>
                                            <SelectItem value="medium">Sedang (Medium)</SelectItem>
                                            <SelectItem value="high">Tinggi (High)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority && <p className="text-sm text-red-500">{errors.priority}</p>}
                                </div>

                                <Button type="submit" variant="destructive" className="w-full" disabled={processing}>
                                    {processing ? 'Mengirim...' : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" /> Kirim Laporan
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

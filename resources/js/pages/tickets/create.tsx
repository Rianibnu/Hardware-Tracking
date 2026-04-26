import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Asset } from '@/types/inventory';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';

interface Props {
    asset?: Asset;
    assets: Asset[];
}

export default function TicketCreate({ asset, assets }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        asset_id: asset ? String(asset.id) : '',
        title: '',
        description: '',
        priority: 'medium',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/tickets');
    }

    const selectedAsset = assets.find((a) => String(a.id) === data.asset_id);

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.visit('/tickets')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Laporkan Masalah</h1>
                    <p className="text-muted-foreground text-sm">Buat ticket perbaikan untuk aset yang bermasalah</p>
                </div>
            </div>

            {selectedAsset && (
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <div>
                                <p className="text-sm font-semibold">{selectedAsset.name}</p>
                                <p className="text-muted-foreground text-xs">
                                    {selectedAsset.category?.name} · {selectedAsset.location?.name}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={submit}>
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">Detail Masalah</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="asset_id">
                                Asset <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.asset_id} onValueChange={(v) => setData('asset_id', v)} required>
                                <SelectTrigger id="asset_id">
                                    <SelectValue placeholder="Pilih asset yang bermasalah" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.name} ({a.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.asset_id && <p className="text-destructive text-xs">{errors.asset_id}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="title">
                                Judul Masalah <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Cth: Laptop tidak bisa menyala"
                                required
                            />
                            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description">
                                Deskripsi Masalah <span className="text-red-500">*</span>
                            </Label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Jelaskan masalah secara detail: kapan terjadi, gejala, sudah dicoba apa..."
                                rows={5}
                                required
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none"
                            />
                            {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="priority">Prioritas</Label>
                            <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">🟢 Rendah — Tidak mendesak</SelectItem>
                                    <SelectItem value="medium">🟡 Sedang — Perlu ditangani segera</SelectItem>
                                    <SelectItem value="high">🔴 Tinggi — Menghambat pekerjaan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.visit('/tickets')}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <Send className="mr-2 h-4 w-4" />
                        {processing ? 'Mengirim...' : 'Kirim Laporan'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

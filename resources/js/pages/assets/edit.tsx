import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Asset, Brand, Category, Location } from '@/types/inventory';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    asset: Asset;
    categories: Category[];
    locations: Location[];
    brands: Brand[];
}

export default function AssetEdit({ asset, categories, locations, brands }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: asset.name,
        category_id: String(asset.category_id),
        serial_number: asset.serial_number ?? '',
        brand_id: asset.brand_id ? String(asset.brand_id) : '',
        model: asset.model ?? '',
        purchase_year: asset.purchase_year ? String(asset.purchase_year) : '',
        status: asset.status,
        location_id: String(asset.location_id),
        notes: asset.notes ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/assets/${asset.id}`);
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.visit(`/assets/${asset.id}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Asset</h1>
                    <p className="text-muted-foreground text-sm">Update informasi aset {asset.code}</p>
                </div>
            </div>

            <form onSubmit={submit}>
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Asset</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Kode Asset</Label>
                                <Input value={asset.code} disabled className="bg-muted" />
                                <p className="text-muted-foreground text-xs">Kode asset tidak dapat diubah</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="name">
                                    Nama Asset <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="category_id">
                                    Kategori <span className="text-red-500">*</span>
                                </Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)} required>
                                    <SelectTrigger id="category_id">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-destructive text-xs">{errors.category_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="location_id">
                                    Lokasi <span className="text-red-500">*</span>
                                </Label>
                                <Select value={data.location_id} onValueChange={(v) => setData('location_id', v)} required>
                                    <SelectTrigger id="location_id">
                                        <SelectValue placeholder="Pilih lokasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((l) => (
                                            <SelectItem key={l.id} value={String(l.id)}>
                                                {l.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.location_id && <p className="text-destructive text-xs">{errors.location_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="brand_id">Brand</Label>
                                <Select value={data.brand_id} onValueChange={(v) => setData('brand_id', v === 'none' ? '' : v)}>
                                    <SelectTrigger id="brand_id">
                                        <SelectValue placeholder="Pilih brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tidak ada --</SelectItem>
                                        {brands.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={data.model}
                                    onChange={(e) => setData('model', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="purchase_year">Tahun Beli</Label>
                                <Input
                                    id="purchase_year"
                                    type="number"
                                    value={data.purchase_year}
                                    onChange={(e) => setData('purchase_year', e.target.value)}
                                    min={2000}
                                    max={2100}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="serial_number">Serial Number</Label>
                                <Input
                                    id="serial_number"
                                    value={data.serial_number}
                                    onChange={(e) => setData('serial_number', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={data.status} onValueChange={(v: any) => setData('status', v)}>
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Tersedia</SelectItem>
                                        <SelectItem value="in_use">Digunakan</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="broken">Rusak</SelectItem>
                                        <SelectItem value="disposed">Dibuang</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes">Catatan</Label>
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.visit(`/assets/${asset.id}`)}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

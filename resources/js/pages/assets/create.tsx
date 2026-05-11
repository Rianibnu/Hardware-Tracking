import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Brand, Category, Location } from '@/types/inventory';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    categories: Category[];
    locations: Location[];
    brands: Brand[];
}

export default function AssetCreate({ categories, locations, brands }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        category_id: '',
        serial_number: '',
        ip_address: '',
        ram_capacity: '',
        windows_license: '',
        office_license: '',
        pic: '',
        remote_access_type: '',
        remote_access_id: '',
        brand_id: '',
        model: '',
        purchase_year: '',
        status: 'available',
        location_id: '',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/assets');
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.visit('/assets')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Tambah Asset</h1>
                    <p className="text-muted-foreground text-sm">Daftarkan aset IT baru ke sistem</p>
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
                                <Label htmlFor="code">
                                    Kode Asset <span className="text-muted-foreground">(opsional)</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="Auto-generate jika kosong"
                                />
                                {errors.code && <p className="text-destructive text-xs">{errors.code}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="name">
                                    Nama Asset <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Cth: Laptop HP ProBook 450"
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
                                    placeholder="ProBook 450 G9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="purchase_year">Tahun Beli</Label>
                                <Input
                                    id="purchase_year"
                                    type="number"
                                    value={data.purchase_year}
                                    onChange={(e) => setData('purchase_year', e.target.value)}
                                    placeholder="2024"
                                    min={2000}
                                    max={2100}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="serial_number">Serial Number</Label>
                                <Input
                                    id="serial_number"
                                    value={data.serial_number}
                                    onChange={(e) => setData('serial_number', e.target.value)}
                                    placeholder="SN-XXXXX"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ip_address">IP Address</Label>
                                <Input
                                    id="ip_address"
                                    value={data.ip_address}
                                    onChange={(e) => setData('ip_address', e.target.value)}
                                    placeholder="192.168.X.X"
                                />
                                {errors.ip_address && <p className="text-destructive text-xs">{errors.ip_address}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ram_capacity">Kapasitas RAM</Label>
                                <Input
                                    id="ram_capacity"
                                    value={data.ram_capacity}
                                    onChange={(e) => setData('ram_capacity', e.target.value)}
                                    placeholder="Cth: 8 GB"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="windows_license">Lisensi Windows</Label>
                                <Input
                                    id="windows_license"
                                    value={data.windows_license}
                                    onChange={(e) => setData('windows_license', e.target.value)}
                                    placeholder="Cth: Original OEM"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="office_license">Lisensi Office</Label>
                                <Input
                                    id="office_license"
                                    value={data.office_license}
                                    onChange={(e) => setData('office_license', e.target.value)}
                                    placeholder="Cth: License tidak terdeteksi"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="pic">Penanggung Jawab</Label>
                                <Input
                                    id="pic"
                                    value={data.pic}
                                    onChange={(e) => setData('pic', e.target.value)}
                                    placeholder="Nama PIC"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="remote_access_type">Remote Access Type</Label>
                                <Select value={data.remote_access_type || 'none'} onValueChange={(v) => setData('remote_access_type', v === 'none' ? '' : v)}>
                                    <SelectTrigger id="remote_access_type"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tidak ada --</SelectItem>
                                        <SelectItem value="vnc">VNC (RealVNC)</SelectItem>
                                        <SelectItem value="rustdesk">RustDesk</SelectItem>
                                        <SelectItem value="anydesk">AnyDesk</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="remote_access_id">Remote Access ID</Label>
                                <Input id="remote_access_id" value={data.remote_access_id} onChange={(e) => setData('remote_access_id', e.target.value)} placeholder="IP atau Device ID" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
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
                                placeholder="Informasi tambahan tentang asset ini..."
                                rows={3}
                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.visit('/assets')}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Asset'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

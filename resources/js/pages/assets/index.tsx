import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead } from '@/components/sortable-table-head';
import type { Asset, AssetStatus, PaginatedResponse } from '@/types/inventory';
import { router, usePage } from '@inertiajs/react';
import { Eye, MapPin, Package, Plus, QrCode, Search, Wrench } from 'lucide-react';
import { useState } from 'react';

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
    assets: PaginatedResponse<Asset>;
    filters: { search?: string; status?: string; sort?: string; dir?: string };
    auth: { user: { role: string } };
}

export default function AssetsIndex({ assets, filters, auth }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const isAdmin = auth.user.role === 'admin';

    function applyFilters(newSearch?: string, newStatus?: string, newSort?: string, newDir?: string) {
        router.get(
            '/assets',
            {
                search: newSearch ?? search,
                status: newStatus ?? status,
                sort: newSort ?? filters.sort,
                dir: newDir ?? filters.dir,
            },
            { preserveState: true, replace: true },
        );
    }
    
    const handleSort = (field: string, dir: 'asc' | 'desc') => {
        applyFilters(undefined, undefined, field, dir);
    };

    const stats = {
        total: assets.total,
        available: assets.data.filter((a) => a.status === 'available').length,
        maintenance: assets.data.filter((a) => a.status === 'maintenance').length,
        broken: assets.data.filter((a) => a.status === 'broken').length,
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Asset Inventory</h1>
                    <p className="text-muted-foreground text-sm">Kelola semua aset IT perusahaan</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => router.visit('/assets/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Asset
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { label: 'Total Asset', value: assets.total, icon: Package, color: 'text-blue-500' },
                    { label: 'Tersedia', value: stats.available, icon: Package, color: 'text-emerald-500' },
                    { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-amber-500' },
                    { label: 'Rusak', value: stats.broken, icon: Wrench, color: 'text-red-500' },
                ].map((stat) => (
                    <Card key={stat.label} className="border-border/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                <div>
                                    <p className="text-muted-foreground text-xs">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-border/50">
                <CardContent className="pt-4">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters(search, status, filters.sort, filters.dir);
                        }} 
                        className="flex flex-wrap gap-3"
                    >
                        <div className="relative w-full max-w-sm sm:w-auto">
                            <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                            <Input
                                placeholder="Cari nama / kode aset..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select
                            value={status || 'all'}
                            onValueChange={(v) => {
                                const val = v === 'all' ? '' : v;
                                setStatus(val);
                                applyFilters(undefined, val);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" variant="outline">
                            <Search className="mr-2 h-4 w-4" />
                            Cari
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        {assets.total} Asset
                        {filters.search && ` — hasil pencarian "${filters.search}"`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Mobile Card Layout */}
                    <div className="space-y-3 md:hidden">
                        {assets.data.length === 0 && (
                            <p className="text-muted-foreground py-8 text-center text-sm">Tidak ada asset ditemukan</p>
                        )}
                        {assets.data.map((asset) => (
                            <div
                                key={asset.id}
                                className="rounded-lg border p-3 active:bg-muted/50 transition-colors"
                                onClick={() => router.visit(`/assets/${asset.id}`)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{asset.name}</p>
                                        <code className="text-muted-foreground text-xs">{asset.code}</code>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 text-[10px] ${STATUS_COLORS[asset.status]}`}>
                                        {STATUS_LABELS[asset.status]}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    {asset.category?.name && (
                                        <span className="flex items-center gap-1">
                                            <Package className="h-3 w-3" /> {asset.category.name}
                                        </span>
                                    )}
                                    {asset.location?.name && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {asset.location.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <SortableTableHead field="code" label="Kode" currentSort={filters.sort} currentDir={filters.dir} onSort={handleSort} />
                                    <SortableTableHead field="name" label="Nama" currentSort={filters.sort} currentDir={filters.dir} onSort={handleSort} />
                                    <th className="text-muted-foreground pb-3 text-left font-medium">Kategori</th>
                                    <th className="text-muted-foreground pb-3 text-left font-medium">Lokasi</th>
                                    <SortableTableHead field="status" label="Status" currentSort={filters.sort} currentDir={filters.dir} onSort={handleSort} />
                                    <th className="text-muted-foreground pb-3 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {assets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground py-8 text-center">
                                            Tidak ada asset ditemukan
                                        </td>
                                    </tr>
                                )}
                                {assets.data.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3">
                                            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{asset.code}</code>
                                        </td>
                                        <td className="py-3 font-medium">{asset.name}</td>
                                        <td className="text-muted-foreground py-3">{asset.category?.name ?? '—'}</td>
                                        <td className="text-muted-foreground py-3">{asset.location?.name ?? '—'}</td>
                                        <td className="py-3">
                                            <Badge variant="outline" className={STATUS_COLORS[asset.status]}>
                                                {STATUS_LABELS[asset.status]}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    title="Lihat Detail & QR Code"
                                                    onClick={() => router.visit(`/assets/${asset.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {assets.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-muted-foreground text-sm">
                                Menampilkan {assets.from}–{assets.to} dari {assets.total}
                            </p>
                            <div className="flex gap-1">
                                {assets.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

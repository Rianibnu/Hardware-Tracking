import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { SortableTableHead } from '@/components/sortable-table-head';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Location, PaginatedResponse } from '@/types/inventory';
import { usePage, router } from '@inertiajs/react';

export default function Locations({ locations }: { locations: PaginatedResponse<Location> }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1]);
    const sort = { field: params.get('sort') || 'name', dir: (params.get('dir') || 'asc') as 'asc' | 'desc' };

    const handleSort = (field: string, dir: 'asc' | 'desc') => {
        router.get('/locations', { sort: field, dir }, { preserveState: true });
    };

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        building: '',
        floor: '',
        room: '',
    });

    const openEdit = (location: Location) => {
        setData({ 
            name: location.name, 
            building: location.building ?? '',
            floor: location.floor ?? '',
            room: location.room ?? '',
        });
        setEditingId(location.id);
        setOpenDialog(true);
    };

    const openCreate = () => {
        reset();
        setEditingId(null);
        setOpenDialog(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/locations/${editingId}`, {
                onSuccess: () => setOpenDialog(false),
            });
        } else {
            post('/locations', {
                onSuccess: () => setOpenDialog(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus lokasi ini?')) {
            destroy(`/locations/${id}`);
        }
    };

    return (
        <>
            <Head title="Master Lokasi" />
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Master Lokasi</h1>
                        <p className="text-muted-foreground text-sm">Kelola lokasi fisik aset</p>
                    </div>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Lokasi
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Lokasi' : 'Tambah Lokasi'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nama Lokasi <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Cth: Ruang Server 1"
                                        required
                                    />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Gedung</Label>
                                        <Input
                                            value={data.building}
                                            onChange={e => setData('building', e.target.value)}
                                            placeholder="Cth: Gedung A"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Lantai</Label>
                                        <Input
                                            value={data.floor}
                                            onChange={e => setData('floor', e.target.value)}
                                            placeholder="Cth: Lt. 3"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ruangan</Label>
                                    <Input
                                        value={data.room}
                                        onChange={e => setData('room', e.target.value)}
                                        placeholder="Cth: 301"
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={processing}>Simpan</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <SortableTableHead field="id" label="ID" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <SortableTableHead field="name" label="Nama Lokasi" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <SortableTableHead field="building" label="Gedung" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <SortableTableHead field="floor" label="Lantai" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <SortableTableHead field="room" label="Ruang" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {locations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                Tidak ada data lokasi.
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.data.map((location) => (
                                            <tr key={location.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{location.id}</td>
                                                <td className="p-4 align-middle font-medium">{location.name}</td>
                                                <td className="p-4 align-middle">{location.building || '-'}</td>
                                                <td className="p-4 align-middle">{location.floor || '-'}</td>
                                                <td className="p-4 align-middle">{location.room || '-'}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(location)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)}>
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                    {locations.last_page > 1 && (
                        <div className="p-4 border-t border-border/50 flex items-center justify-center gap-1">
                            {locations.links.map((link: any, i: number) => (
                                <Button
                                    key={i}
                                    size="sm"
                                    variant={link.active ? 'default' : 'outline'}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}

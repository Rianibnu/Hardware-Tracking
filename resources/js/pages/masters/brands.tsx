import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { SortableTableHead } from '@/components/sortable-table-head';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Brand, PaginatedResponse } from '@/types/inventory';
import { usePage, router } from '@inertiajs/react';

export default function Brands({ brands }: { brands: PaginatedResponse<Brand> }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1]);
    const sort = { field: params.get('sort') || 'name', dir: (params.get('dir') || 'asc') as 'asc' | 'desc' };

    const handleSort = (field: string, dir: 'asc' | 'desc') => {
        router.get('/brands', { sort: field, dir }, { preserveState: true });
    };

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        description: '',
    });

    const openEdit = (brand: Brand) => {
        setData({ name: brand.name, description: brand.description ?? '' });
        setEditingId(brand.id);
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
            put(`/brands/${editingId}`, {
                onSuccess: () => setOpenDialog(false),
            });
        } else {
            post('/brands', {
                onSuccess: () => setOpenDialog(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus brand ini?')) {
            destroy(`/brands/${id}`);
        }
    };

    return (
        <>
            <Head title="Master Brand" />
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Master Brand</h1>
                        <p className="text-muted-foreground text-sm">Kelola data merek perangkat IT</p>
                    </div>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Brand
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Brand' : 'Tambah Brand'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nama Brand</Label>
                                    <Input
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Deskripsi</Label>
                                    <Input
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
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
                                        <SortableTableHead field="name" label="Nama Brand" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <SortableTableHead field="description" label="Deskripsi" currentSort={sort.field} currentDir={sort.dir} onSort={handleSort} />
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {brands.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                Tidak ada data brand.
                                            </td>
                                        </tr>
                                    ) : (
                                        brands.data.map((brand) => (
                                            <tr key={brand.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{brand.id}</td>
                                                <td className="p-4 align-middle font-medium">{brand.name}</td>
                                                <td className="p-4 align-middle">{brand.description || '-'}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)}>
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
                    {brands.last_page > 1 && (
                        <div className="p-4 border-t border-border/50 flex items-center justify-center gap-1">
                            {brands.links.map((link: any, i: number) => (
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

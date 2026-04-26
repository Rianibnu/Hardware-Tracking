import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginatedResponse, User } from '@/types/inventory';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash, UserCog } from 'lucide-react';
import { useState } from 'react';

export default function Users({ users, filters }: { users: PaginatedResponse<User>; filters: any }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1]);
    const sort = { field: params.get('sort') || 'name', dir: (params.get('dir') || 'asc') as 'asc' | 'desc' };

    const handleSort = (field: string) => {
        const dir = sort.field === field && sort.dir === 'asc' ? 'desc' : 'asc';
        router.get('/users', { ...filters, sort: field, dir }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search');
        router.get('/users', { ...filters, search, page: 1 }, { preserveState: true });
    };

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        email: '',
        role: 'teknisi',
        password: '',
    });

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingId(user.id);
            setData({
                name: user.name,
                email: user.email,
                role: user.role,
                password: '',
            });
        } else {
            setEditingId(null);
            reset();
        }
        setOpenDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/users/${editingId}`, {
                onSuccess: () => {
                    setOpenDialog(false);
                    reset();
                },
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    setOpenDialog(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus user ini?')) {
            destroy(`/users/${id}`);
        }
    };

    return (
        <>
            <Head title="Manajemen User" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Manajemen User</h1>
                        <p className="text-muted-foreground text-sm">Kelola akses administrator dan teknisi</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah User
                    </Button>
                </div>

                <Card className="border-border/50">
                    <CardHeader className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UserCog className="h-5 w-5" />
                                Daftar User
                            </CardTitle>
                            <form onSubmit={handleSearch} className="flex max-w-sm flex-1 items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                                    <Input
                                        name="search"
                                        placeholder="Cari nama / email..."
                                        className="pl-9"
                                        defaultValue={filters?.search || ''}
                                    />
                                </div>
                                <Select 
                                    value={filters?.role || ''} 
                                    onValueChange={(val) => {
                                        router.get('/users', { ...filters, role: val === 'all' ? '' : val, page: 1 }, { preserveState: true })
                                    }}
                                >
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue placeholder="Semua Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Role</SelectItem>
                                        <SelectItem value="admin">Admin IT</SelectItem>
                                        <SelectItem value="teknisi">Teknisi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th
                                            className="cursor-pointer p-4 text-left font-medium select-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            Nama Lengkap {sort.field === 'name' && (sort.dir === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            className="cursor-pointer p-4 text-left font-medium select-none"
                                            onClick={() => handleSort('email')}
                                        >
                                            Email {sort.field === 'email' && (sort.dir === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-4 text-left font-medium">Role</th>
                                        <th className="p-4 text-left font-medium">Dibuat Pada</th>
                                        <th className="p-4 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                Tidak ada data user.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">{user.name}</td>
                                                <td className="p-4 align-middle text-muted-foreground">{user.email}</td>
                                                <td className="p-4 align-middle capitalize">
                                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(user)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                    {users.last_page > 1 && (
                        <div className="p-4 border-t border-border/50 flex items-center justify-center gap-1">
                            {users.links.map((link: any, i: number) => (
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

                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit User' : 'Tambah User'}</DialogTitle>
                                <DialogDescription>
                                    Masukkan detail pengguna. {editingId && 'Kosongkan password jika tidak ingin diubah.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Lengkap</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={data.role} onValueChange={(val) => setData('role', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="teknisi">Teknisi</SelectItem>
                                            <SelectItem value="admin">Admin IT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password {editingId && '(Opsional)'}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required={!editingId}
                                    />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

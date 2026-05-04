import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { Consumable, Location, Category, PaginatedResponse } from '@/types/inventory';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Boxes, Package, ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    consumables: PaginatedResponse<Consumable>;
    categories: Category[];
    locations: Location[];
    filters: any;
}

export default function PublicConsumables({ consumables, categories, locations, filters }: Props) {
    const { auth } = usePage<any>().props;
    const [showRequest, setShowRequest] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Consumable | null>(null);

    const requestForm = useForm({
        consumable_id: '',
        quantity: '',
        public_requester_name: '',
        public_requester_email: '',
        location_id: '',
        reason: '',
    });

    const handleFilter = (key: string, value: string) => {
        const f = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/public/consumables', f, { preserveState: true, replace: true });
    };

    const submitRequest = (e: React.FormEvent) => {
        e.preventDefault();
        requestForm.post('/public/consumables/request', {
            onSuccess: () => {
                setShowRequest(false);
                requestForm.reset();
                setSelectedItem(null);
            }
        });
    };

    const openRequestModal = (c: Consumable) => {
        setSelectedItem(c);
        requestForm.setData('consumable_id', String(c.id));
        setShowRequest(true);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-primary/30">
            <Head title="Katalog Barang Habis Pakai — Publik" />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                                <Package className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">RIR STUDIO</h1>
                                <p className="text-[10px] font-medium tracking-wider text-indigo-400 uppercase">IT Inventory</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Beranda
                                </Button>
                            </Link>
                            {auth?.user ? (
                                <Link href="/dashboard"><Button size="sm">Dashboard</Button></Link>
                            ) : (
                                <Link href="/login"><Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">Masuk</Button></Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Katalog Barang Habis Pakai</h2>
                    <p className="text-zinc-400">Pilih barang yang Anda butuhkan dan ajukan permintaan langsung ke tim IT.</p>
                </div>

                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                            <form onSubmit={e => { e.preventDefault(); handleFilter('search', e.currentTarget.search.value); }} className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative w-full md:w-[300px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                    <Input name="search" defaultValue={filters?.search} placeholder="Cari nama atau SKU..." className="pl-9 bg-zinc-950 border-white/10 text-white" />
                                </div>
                                <Button type="submit" variant="secondary" size="sm">Cari</Button>
                            </form>
                            <Select value={filters?.category_id ?? 'all'} onValueChange={v => handleFilter('category_id', v)}>
                                <SelectTrigger className="w-full md:w-[200px] bg-zinc-950 border-white/10 text-white"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {consumables.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                                <Boxes className="h-12 w-12 mb-4 opacity-50" />
                                <p>Tidak ada barang yang ditemukan.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-zinc-400">Nama Barang</TableHead>
                                            <TableHead className="text-zinc-400">Kategori</TableHead>
                                            <TableHead className="text-zinc-400">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {consumables.data.map(c => (
                                            <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                                                <TableCell>
                                                    <p className="font-semibold text-white">{c.name}</p>
                                                    {c.sku && <p className="text-xs text-zinc-500">SKU: {c.sku}</p>}
                                                    {c.description && <p className="text-xs text-zinc-400 mt-1 max-w-md truncate">{c.description}</p>}
                                                </TableCell>
                                                <TableCell className="text-zinc-300">{c.category?.name ?? '-'}</TableCell>
                                                <TableCell>
                                                    <Button size="sm" onClick={() => openRequestModal(c)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-900/20">
                                                        Minta Barang
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {consumables.last_page > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex gap-2">
                            {consumables.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${link.active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-white'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Request Modal */}
            <Dialog open={showRequest} onOpenChange={setShowRequest}>
                <DialogContent className="bg-zinc-950 border-white/10 text-zinc-50 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Form Permintaan Barang</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <form onSubmit={submitRequest} className="space-y-4 mt-2">
                            <div className="rounded-lg bg-zinc-900/50 p-3 border border-white/5 mb-4">
                                <p className="text-sm font-medium text-white">{selectedItem.name}</p>
                                <p className="text-xs text-zinc-400">Kategori: {selectedItem.category?.name ?? '-'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-zinc-400">Jumlah *</Label>
                                    <div className="relative">
                                        <Input type="number" min="1" required className="bg-zinc-900 border-white/10 text-white pr-12" value={requestForm.data.quantity} onChange={e => requestForm.setData('quantity', e.target.value)} />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-zinc-500 text-sm">{selectedItem.unit}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-zinc-400">Lokasi Penempatan *</Label>
                                    <Select required value={requestForm.data.location_id} onValueChange={v => requestForm.setData('location_id', v)}>
                                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white"><SelectValue placeholder="Pilih lokasi..." /></SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            {locations.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}{l.room ? ` - ${l.room}` : ''}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400">Nama Anda *</Label>
                                <Input required placeholder="Masukkan nama lengkap" className="bg-zinc-900 border-white/10 text-white" value={requestForm.data.public_requester_name} onChange={e => requestForm.setData('public_requester_name', e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400">Email Anda (Opsional)</Label>
                                <Input type="email" placeholder="Untuk update status" className="bg-zinc-900 border-white/10 text-white" value={requestForm.data.public_requester_email} onChange={e => requestForm.setData('public_requester_email', e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400">Alasan Permintaan *</Label>
                                <Textarea required placeholder="Kenapa butuh barang ini?" className="bg-zinc-900 border-white/10 text-white min-h-[80px]" value={requestForm.data.reason} onChange={e => requestForm.setData('reason', e.target.value)} />
                            </div>

                            <DialogFooter className="mt-6 pt-4 border-t border-white/5">
                                <Button type="button" variant="ghost" onClick={() => setShowRequest(false)} className="text-zinc-400 hover:text-white">Batal</Button>
                                <Button type="submit" disabled={requestForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kirim Permintaan</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

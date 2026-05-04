import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { SortableTableHead } from '@/components/sortable-table-head';
import type { Consumable, ConsumableRequest as CRequest, PaginatedResponse, Category, Location, User } from '@/types/inventory';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Boxes, Plus, PackagePlus, Send, CheckCircle, XCircle, ArrowDownToLine, ArrowUpFromLine, Search, Filter, AlertTriangle, Package } from 'lucide-react';
import { useState } from 'react';

interface Props {
    consumables: PaginatedResponse<Consumable>;
    filters: Record<string, string | undefined>;
    categories: Category[];
    locations: Location[];
    users: User[];
    pendingRequestsCount: number;
    pendingRequests: CRequest[];
    auth: { user: User };
}

const STOCK_BADGE: Record<string, { label: string; class: string }> = {
    safe: { label: 'Aman', class: 'border-emerald-200 bg-emerald-500/15 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400' },
    low: { label: 'Menipis', class: 'border-amber-200 bg-amber-500/15 text-amber-600 dark:border-amber-800 dark:text-amber-400' },
    empty: { label: 'Habis', class: 'border-red-200 bg-red-500/15 text-red-600 dark:border-red-800 dark:text-red-400' },
};

const REQ_BADGE: Record<string, { label: string; class: string }> = {
    pending: { label: 'Menunggu', class: 'border-amber-200 bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    approved: { label: 'Disetujui', class: 'border-blue-200 bg-blue-500/15 text-blue-600 dark:text-blue-400' },
    rejected: { label: 'Ditolak', class: 'border-red-200 bg-red-500/15 text-red-600 dark:text-red-400' },
    fulfilled: { label: 'Terpenuhi', class: 'border-emerald-200 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

export default function ConsumablesIndex({ consumables, filters, categories, locations, users, pendingRequestsCount, pendingRequests, auth }: Props) {
    const isAdmin = auth.user.role === 'admin';
    const [showAdd, setShowAdd] = useState(false);
    const [showStockIn, setShowStockIn] = useState<Consumable | null>(null);
    const [showDistribute, setShowDistribute] = useState<Consumable | null>(null);
    const [showRequest, setShowRequest] = useState(false);
    const [showReject, setShowReject] = useState<CRequest | null>(null);
    const [search, setSearch] = useState(filters?.search ?? '');

    const addForm = useForm({ name: '', sku: '', category_id: '', unit: 'pcs', min_stock: '0', description: '' });
    const stockInForm = useForm({ quantity: '', unit_price: '', supplier: '', notes: '' });
    const distributeForm = useForm({ quantity: '', distributed_to: '', location_id: '', notes: '' });
    const requestForm = useForm({ consumable_id: '', quantity: '', location_id: '', reason: '' });
    const rejectForm = useForm({ rejected_reason: '' });

    const handleSort = (field: string, dir: 'asc' | 'desc') => {
        router.get('/consumables', { ...filters, sort: field, dir }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/consumables', { ...filters, search }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const f = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/consumables', f, { preserveState: true, replace: true });
    };

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/consumables', { onSuccess: () => { setShowAdd(false); addForm.reset(); } });
    };

    const submitStockIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showStockIn) return;
        stockInForm.post(`/consumables/${showStockIn.id}/stock-in`, { onSuccess: () => { setShowStockIn(null); stockInForm.reset(); } });
    };

    const submitDistribute = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showDistribute) return;
        distributeForm.post(`/consumables/${showDistribute.id}/distribute`, { onSuccess: () => { setShowDistribute(null); distributeForm.reset(); } });
    };

    const submitRequest = (e: React.FormEvent) => {
        e.preventDefault();
        requestForm.post('/consumable-requests', { onSuccess: () => { setShowRequest(false); requestForm.reset(); } });
    };

    const submitReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showReject) return;
        rejectForm.post(`/consumable-requests/${showReject.id}/reject`, { onSuccess: () => { setShowReject(null); rejectForm.reset(); } });
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <Head title="Stok Barang Habis Pakai" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Stok Barang Habis Pakai</h1>
                        <p className="text-muted-foreground">Kelola stok barang habis pakai IT dan distribusi ke lokasi.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowRequest(true)}>
                            <Send className="mr-2 h-4 w-4" /> Request Barang
                        </Button>
                        {isAdmin && (
                            <Button onClick={() => setShowAdd(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Barang
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="stock">
                    <TabsList>
                        <TabsTrigger value="stock">
                            <Boxes className="mr-1.5 h-4 w-4" /> Daftar Stok
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="relative">
                            <Send className="mr-1.5 h-4 w-4" /> Permintaan
                            {pendingRequestsCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingRequestsCount}</span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* === STOCK TAB === */}
                    <TabsContent value="stock" className="mt-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Cari nama / SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                                </div>
                                <Button type="submit" variant="outline" size="sm">Cari</Button>
                            </form>
                            <Select value={filters?.category_id ?? 'all'} onValueChange={v => handleFilter('category_id', v)}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters?.stock_status ?? 'all'} onValueChange={v => handleFilter('stock_status', v)}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="safe">🟢 Aman</SelectItem>
                                    <SelectItem value="low">🟡 Menipis</SelectItem>
                                    <SelectItem value="empty">🔴 Habis</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Card className="border-border/50">
                            <CardContent className="p-0">
                                {consumables.data.length === 0 ? (
                                    <div className="flex h-40 flex-col items-center justify-center text-center">
                                        <Package className="text-muted-foreground/50 mb-2 h-10 w-10" />
                                        <p className="text-muted-foreground">Belum ada barang habis pakai.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <SortableTableHead field="name" label="Nama Barang" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} />
                                                    <TableHead>SKU</TableHead>
                                                    <TableHead>Kategori</TableHead>
                                                    <SortableTableHead field="current_stock" label="Stok" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} />
                                                    <TableHead>Min</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {consumables.data.map(item => {
                                                    const sb = STOCK_BADGE[item.stock_status];
                                                    return (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                <Link href={`/consumables/${item.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                                                                    {item.name}
                                                                </Link>
                                                                <p className="text-xs text-muted-foreground">{item.unit}</p>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">{item.sku ?? '-'}</TableCell>
                                                            <TableCell>{item.category?.name ?? '-'}</TableCell>
                                                            <TableCell className="font-bold text-lg">{item.current_stock}</TableCell>
                                                            <TableCell className="text-muted-foreground">{item.min_stock}</TableCell>
                                                            <TableCell><Badge variant="outline" className={sb.class}>{sb.label}</Badge></TableCell>
                                                            {isAdmin && (
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { stockInForm.reset(); setShowStockIn(item); }}>
                                                                            <ArrowDownToLine className="mr-1 h-3 w-3" /> Masuk
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { distributeForm.reset(); setShowDistribute(item); }}>
                                                                            <ArrowUpFromLine className="mr-1 h-3 w-3" /> Keluar
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {consumables.last_page > 1 && (
                            <div className="flex justify-center mt-4">
                                <div className="flex gap-2">
                                    {consumables.links.map((link, i) => (
                                        <Link key={i} href={link.url || '#'} className={`px-3 py-1 rounded-md border text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* === REQUESTS TAB === */}
                    <TabsContent value="requests" className="mt-4">
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5" /> Permintaan Barang
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {pendingRequests.length === 0 ? (
                                    <div className="flex h-40 flex-col items-center justify-center text-center">
                                        <CheckCircle className="text-muted-foreground/50 mb-2 h-10 w-10" />
                                        <p className="text-muted-foreground">Tidak ada permintaan yang menunggu.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Barang</TableHead>
                                                    <TableHead>Jumlah</TableHead>
                                                    <TableHead>Pemohon</TableHead>
                                                    <TableHead>Lokasi</TableHead>
                                                    <TableHead>Alasan</TableHead>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingRequests.map(req => {
                                                    const rb = REQ_BADGE[req.status];
                                                    return (
                                                        <TableRow key={req.id}>
                                                            <TableCell className="font-medium">{req.consumable?.name ?? '-'}</TableCell>
                                                            <TableCell className="font-bold">{req.quantity} <span className="text-xs text-muted-foreground">{req.consumable?.unit}</span></TableCell>
                                                            <TableCell>
                                                                {req.requester?.name ?? (
                                                                    req.public_requester_name ? (
                                                                        <span>{req.public_requester_name} <Badge variant="outline" className="text-[10px] py-0 px-1 ml-1">Publik</Badge></span>
                                                                    ) : '-'
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{req.location?.name ?? '-'}</TableCell>
                                                            <TableCell className="max-w-[200px] truncate">{req.reason ?? '-'}</TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">{fmtDate(req.created_at)}</TableCell>
                                                            <TableCell><Badge variant="outline" className={rb.class}>{rb.label}</Badge></TableCell>
                                                            {isAdmin && req.status === 'pending' && (
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => router.post(`/consumable-requests/${req.id}/fulfill`)}>
                                                                            <CheckCircle className="mr-1 h-3 w-3" /> Penuhi
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => { rejectForm.reset(); setShowReject(req); }}>
                                                                            <XCircle className="mr-1 h-3 w-3" /> Tolak
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            )}
                                                            {isAdmin && req.status !== 'pending' && <TableCell />}
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* === DIALOG: Tambah Barang === */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tambah Barang Habis Pakai</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><Label>Nama Barang *</Label><Input value={addForm.data.name} onChange={e => addForm.setData('name', e.target.value)} /></div>
                            <div><Label>SKU</Label><Input value={addForm.data.sku} onChange={e => addForm.setData('sku', e.target.value)} placeholder="Optional" /></div>
                            <div>
                                <Label>Kategori</Label>
                                <Select value={addForm.data.category_id} onValueChange={v => addForm.setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Satuan *</Label>
                                <Select value={addForm.data.unit} onValueChange={v => addForm.setData('unit', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pcs">Pcs</SelectItem>
                                        <SelectItem value="unit">Unit</SelectItem>
                                        <SelectItem value="box">Box</SelectItem>
                                        <SelectItem value="pack">Pack</SelectItem>
                                        <SelectItem value="roll">Roll</SelectItem>
                                        <SelectItem value="meter">Meter</SelectItem>
                                        <SelectItem value="rim">Rim</SelectItem>
                                        <SelectItem value="set">Set</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div><Label>Stok Minimum</Label><Input type="number" min="0" value={addForm.data.min_stock} onChange={e => addForm.setData('min_stock', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Deskripsi</Label><Textarea value={addForm.data.description} onChange={e => addForm.setData('description', e.target.value)} /></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={addForm.processing}>Simpan</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === DIALOG: Stok Masuk === */}
            <Dialog open={!!showStockIn} onOpenChange={() => setShowStockIn(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Stok Masuk — {showStockIn?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={submitStockIn} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Jumlah *</Label><Input type="number" min="1" value={stockInForm.data.quantity} onChange={e => stockInForm.setData('quantity', e.target.value)} /></div>
                            <div><Label>Harga Satuan (Rp)</Label><Input type="number" min="0" value={stockInForm.data.unit_price} onChange={e => stockInForm.setData('unit_price', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Supplier / Sumber</Label><Input value={stockInForm.data.supplier} onChange={e => stockInForm.setData('supplier', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Catatan</Label><Textarea value={stockInForm.data.notes} onChange={e => stockInForm.setData('notes', e.target.value)} /></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={stockInForm.processing}><ArrowDownToLine className="mr-2 h-4 w-4" /> Catat Stok Masuk</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === DIALOG: Distribusi === */}
            <Dialog open={!!showDistribute} onOpenChange={() => setShowDistribute(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Distribusi — {showDistribute?.name}</DialogTitle></DialogHeader>
                    {showDistribute && <p className="text-sm text-muted-foreground">Stok tersedia: <strong>{showDistribute.current_stock} {showDistribute.unit}</strong></p>}
                    <form onSubmit={submitDistribute} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Jumlah *</Label><Input type="number" min="1" max={showDistribute?.current_stock} value={distributeForm.data.quantity} onChange={e => distributeForm.setData('quantity', e.target.value)} /></div>
                            <div>
                                <Label>Penerima</Label>
                                <Select value={distributeForm.data.distributed_to} onValueChange={v => distributeForm.setData('distributed_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih user..." /></SelectTrigger>
                                    <SelectContent>{users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Lokasi Tujuan</Label>
                                <Select value={distributeForm.data.location_id} onValueChange={v => distributeForm.setData('location_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih lokasi..." /></SelectTrigger>
                                    <SelectContent>{locations.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}{l.room ? ` - ${l.room}` : ''}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2"><Label>Catatan</Label><Textarea value={distributeForm.data.notes} onChange={e => distributeForm.setData('notes', e.target.value)} /></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={distributeForm.processing}><ArrowUpFromLine className="mr-2 h-4 w-4" /> Distribusikan</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === DIALOG: Request Barang === */}
            <Dialog open={showRequest} onOpenChange={setShowRequest}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Request Barang Habis Pakai</DialogTitle></DialogHeader>
                    <form onSubmit={submitRequest} className="space-y-4">
                        <div>
                            <Label>Barang *</Label>
                            <Select value={requestForm.data.consumable_id} onValueChange={v => requestForm.setData('consumable_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
                                <SelectContent>{consumables.data.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.current_stock} {c.unit})</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Jumlah *</Label><Input type="number" min="1" value={requestForm.data.quantity} onChange={e => requestForm.setData('quantity', e.target.value)} /></div>
                            <div>
                                <Label>Lokasi Tujuan</Label>
                                <Select value={requestForm.data.location_id} onValueChange={v => requestForm.setData('location_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                    <SelectContent>{locations.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Alasan</Label><Textarea value={requestForm.data.reason} onChange={e => requestForm.setData('reason', e.target.value)} placeholder="Keperluan request barang..." /></div>
                        <DialogFooter><Button type="submit" disabled={requestForm.processing}><Send className="mr-2 h-4 w-4" /> Kirim Request</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === DIALOG: Reject === */}
            <Dialog open={!!showReject} onOpenChange={() => setShowReject(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tolak Permintaan</DialogTitle></DialogHeader>
                    <form onSubmit={submitReject} className="space-y-4">
                        <div><Label>Alasan Penolakan</Label><Textarea value={rejectForm.data.rejected_reason} onChange={e => rejectForm.setData('rejected_reason', e.target.value)} /></div>
                        <DialogFooter><Button type="submit" variant="destructive" disabled={rejectForm.processing}><XCircle className="mr-2 h-4 w-4" /> Tolak</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

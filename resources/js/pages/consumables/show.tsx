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
import type { Consumable, ConsumableTransaction, ConsumableRequest as CRequest, PaginatedResponse, Location, User } from '@/types/inventory';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Boxes, CheckCircle, Edit, Package, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    consumable: Consumable;
    transactions: PaginatedResponse<ConsumableTransaction>;
    requests: PaginatedResponse<CRequest>;
    locations: Location[];
    users: User[];
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

export default function ConsumableShow({ consumable, transactions, requests, locations, users, auth }: Props) {
    const isAdmin = auth.user.role === 'admin';
    const sb = STOCK_BADGE[consumable.stock_status];
    const [showEdit, setShowEdit] = useState(false);
    const [showStockIn, setShowStockIn] = useState(false);
    const [showDistribute, setShowDistribute] = useState(false);

    const editForm = useForm({
        name: consumable.name,
        sku: consumable.sku ?? '',
        category_id: consumable.category_id ? String(consumable.category_id) : '',
        unit: consumable.unit,
        min_stock: String(consumable.min_stock),
        description: consumable.description ?? '',
    });
    const stockInForm = useForm({ quantity: '', unit_price: '', supplier: '', notes: '' });
    const distributeForm = useForm({ quantity: '', distributed_to: '', location_id: '', notes: '' });

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.put(`/consumables/${consumable.id}`, { onSuccess: () => setShowEdit(false) });
    };

    const submitStockIn = (e: React.FormEvent) => {
        e.preventDefault();
        stockInForm.post(`/consumables/${consumable.id}/stock-in`, { onSuccess: () => { setShowStockIn(false); stockInForm.reset(); } });
    };

    const submitDistribute = (e: React.FormEvent) => {
        e.preventDefault();
        distributeForm.post(`/consumables/${consumable.id}/distribute`, { onSuccess: () => { setShowDistribute(false); distributeForm.reset(); } });
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    return (
        <>
            <Head title={`${consumable.name} — Stok Habis Pakai`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center gap-2">
                    <Link href="/consumables"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Kembali</Button></Link>
                </div>

                {/* Header Info */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card className="md:col-span-2 border-border/50">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Boxes className="h-5 w-5" /> {consumable.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {consumable.sku && <span className="mr-3">SKU: {consumable.sku}</span>}
                                    Satuan: {consumable.unit}
                                    {consumable.category && <span className="ml-3">Kategori: {consumable.category.name}</span>}
                                </p>
                                {consumable.description && <p className="text-sm text-muted-foreground mt-2">{consumable.description}</p>}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}><Edit className="mr-1 h-3 w-3" /> Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => { if (confirm('Hapus barang ini?')) router.delete(`/consumables/${consumable.id}`); }}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                    </Card>

                    <Card className="border-border/50">
                        <CardContent className="pt-6 text-center">
                            <p className="text-5xl font-extrabold">{consumable.current_stock}</p>
                            <p className="text-muted-foreground text-sm mt-1">{consumable.unit} tersedia</p>
                            <Badge variant="outline" className={`mt-2 ${sb.class}`}>{sb.label}</Badge>
                            <p className="text-xs text-muted-foreground mt-2">Minimum: {consumable.min_stock} {consumable.unit}</p>
                            {isAdmin && (
                                <div className="flex gap-2 mt-4 justify-center">
                                    <Button size="sm" onClick={() => { stockInForm.reset(); setShowStockIn(true); }}><ArrowDownToLine className="mr-1 h-3 w-3" /> Masuk</Button>
                                    <Button size="sm" variant="outline" onClick={() => { distributeForm.reset(); setShowDistribute(true); }}><ArrowUpFromLine className="mr-1 h-3 w-3" /> Keluar</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions & Requests */}
                <Tabs defaultValue="transactions">
                    <TabsList>
                        <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
                        <TabsTrigger value="requests">Permintaan</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transactions" className="mt-4">
                        <Card className="border-border/50">
                            <CardContent className="p-0">
                                {transactions.data.length === 0 ? (
                                    <div className="flex h-32 items-center justify-center text-muted-foreground">Belum ada transaksi.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tipe</TableHead>
                                                    <TableHead>Jumlah</TableHead>
                                                    <TableHead>Detail</TableHead>
                                                    <TableHead>Oleh</TableHead>
                                                    <TableHead>Tanggal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transactions.data.map(tx => (
                                                    <TableRow key={tx.id}>
                                                        <TableCell>
                                                            {tx.type === 'in' ? (
                                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                                    <ArrowDownToLine className="mr-1 h-3 w-3" /> Masuk
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-blue-200 bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                                                    <ArrowUpFromLine className="mr-1 h-3 w-3" /> Keluar
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-bold">{tx.type === 'in' ? '+' : '-'}{tx.quantity} <span className="text-xs font-normal text-muted-foreground">{consumable.unit}</span></TableCell>
                                                        <TableCell>
                                                            {tx.type === 'in' ? (
                                                                <div className="text-sm">
                                                                    {tx.supplier && <p>Supplier: {tx.supplier}</p>}
                                                                    {tx.unit_price && <p>Harga: {fmtCurrency(Number(tx.unit_price))}/{consumable.unit}</p>}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm">
                                                                    {tx.recipient ? (
                                                                        <p>Ke: {tx.recipient.name}</p>
                                                                    ) : tx.request?.public_requester_name ? (
                                                                        <p>Ke: {tx.request.public_requester_name} <Badge variant="outline" className="text-[10px] py-0 px-1 ml-1">Publik</Badge></p>
                                                                    ) : null}
                                                                    {tx.location && <p>Lokasi: {tx.location.name}</p>}
                                                                </div>
                                                            )}
                                                            {tx.notes && <p className="text-xs text-muted-foreground mt-0.5">{tx.notes}</p>}
                                                        </TableCell>
                                                        <TableCell className="text-sm">{tx.creator?.name ?? '-'}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{fmtDate(tx.created_at)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        {transactions.last_page > 1 && (
                            <div className="flex justify-center mt-4">
                                <div className="flex gap-2">
                                    {transactions.links.map((link, i) => (
                                        <Link key={i} href={link.url || '#'} className={`px-3 py-1 rounded-md border text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="requests" className="mt-4">
                        <Card className="border-border/50">
                            <CardContent className="p-0">
                                {requests.data.length === 0 ? (
                                    <div className="flex h-32 items-center justify-center text-muted-foreground">Belum ada permintaan.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Pemohon</TableHead>
                                                    <TableHead>Jumlah</TableHead>
                                                    <TableHead>Lokasi</TableHead>
                                                    <TableHead>Alasan</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Tanggal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {requests.data.map(req => {
                                                    const rb = REQ_BADGE[req.status];
                                                    return (
                                                        <TableRow key={req.id}>
                                                            <TableCell className="font-medium">
                                                                {req.requester?.name ?? (
                                                                    req.public_requester_name ? (
                                                                        <span>{req.public_requester_name} <Badge variant="outline" className="text-[10px] py-0 px-1 ml-1">Publik</Badge></span>
                                                                    ) : '-'
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="font-bold">{req.quantity} <span className="text-xs font-normal text-muted-foreground">{consumable.unit}</span></TableCell>
                                                            <TableCell>{req.location?.name ?? '-'}</TableCell>
                                                            <TableCell className="max-w-[200px] truncate">{req.reason ?? '-'}</TableCell>
                                                            <TableCell><Badge variant="outline" className={rb.class}>{rb.label}</Badge></TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">{fmtDate(req.created_at)}</TableCell>
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

            {/* === DIALOG: Edit === */}
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Barang</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><Label>Nama *</Label><Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} /></div>
                            <div><Label>SKU</Label><Input value={editForm.data.sku} onChange={e => editForm.setData('sku', e.target.value)} /></div>
                            <div>
                                <Label>Satuan *</Label>
                                <Select value={editForm.data.unit} onValueChange={v => editForm.setData('unit', v)}>
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
                            <div><Label>Stok Minimum</Label><Input type="number" min="0" value={editForm.data.min_stock} onChange={e => editForm.setData('min_stock', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Deskripsi</Label><Textarea value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} /></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={editForm.processing}>Simpan</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === DIALOG: Stok Masuk === */}
            <Dialog open={showStockIn} onOpenChange={setShowStockIn}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Stok Masuk — {consumable.name}</DialogTitle></DialogHeader>
                    <form onSubmit={submitStockIn} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Jumlah *</Label><Input type="number" min="1" value={stockInForm.data.quantity} onChange={e => stockInForm.setData('quantity', e.target.value)} /></div>
                            <div><Label>Harga Satuan (Rp)</Label><Input type="number" min="0" value={stockInForm.data.unit_price} onChange={e => stockInForm.setData('unit_price', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Supplier</Label><Input value={stockInForm.data.supplier} onChange={e => stockInForm.setData('supplier', e.target.value)} /></div>
                            <div className="col-span-2"><Label>Catatan</Label><Textarea value={stockInForm.data.notes} onChange={e => stockInForm.setData('notes', e.target.value)} /></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={stockInForm.processing}><ArrowDownToLine className="mr-2 h-4 w-4" /> Catat Stok Masuk</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === DIALOG: Distribusi === */}
            <Dialog open={showDistribute} onOpenChange={setShowDistribute}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Distribusi — {consumable.name}</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Stok tersedia: <strong>{consumable.current_stock} {consumable.unit}</strong></p>
                    <form onSubmit={submitDistribute} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Jumlah *</Label><Input type="number" min="1" max={consumable.current_stock} value={distributeForm.data.quantity} onChange={e => distributeForm.setData('quantity', e.target.value)} /></div>
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
        </>
    );
}

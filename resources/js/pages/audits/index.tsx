import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AuditIndex({ audits, locations }: any) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        location_id: '',
        notes: ''
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/audits', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            }
        });
    };

    return (
        <>
            <Head title="Audit Aset" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Audit / Stock Opname</h1>
                        <p className="text-muted-foreground">Kelola sesi pengecekan aset berkala.</p>
                    </div>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Mulai Audit Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Mulai Sesi Audit Baru</DialogTitle>
                                <DialogDescription>
                                    Pilih lokasi yang akan diaudit. Sistem akan memuat semua aset yang terdaftar di lokasi tersebut.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={submit}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location_id">Lokasi</Label>
                                        <Select 
                                            value={data.location_id} 
                                            onValueChange={(val) => setData('location_id', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Lokasi..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map((loc: any) => (
                                                    <SelectItem key={loc.id} value={loc.id.toString()}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.location_id && <p className="text-sm text-destructive">{errors.location_id}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                        <Input 
                                            id="notes" 
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Contoh: Audit Triwulan 1" 
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                                    <Button type="submit" disabled={processing}>Mulai Audit</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Audit</CardTitle>
                        <CardDescription>Daftar sesi audit yang sedang berjalan atau sudah selesai.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal Mulai</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Jumlah Aset</TableHead>
                                    <TableHead>Auditor</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audits.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Belum ada data audit.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.data.map((audit: any) => (
                                        <TableRow key={audit.id}>
                                            <TableCell>{new Date(audit.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                                            <TableCell className="font-medium">{audit.location?.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={audit.status === 'ongoing' ? 'secondary' : 'default'}>
                                                    {audit.status === 'ongoing' ? 'Berjalan' : 'Selesai'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{audit.details_count} Aset</TableCell>
                                            <TableCell>{audit.creator?.name}</TableCell>
                                            <TableCell>
                                                <Link href={`/audits/${audit.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-2">
                                                        <ClipboardList className="h-4 w-4" />
                                                        {audit.status === 'ongoing' ? 'Lanjutkan' : 'Lihat Hasil'}
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AuditIndex.layout = {
    breadcrumbs: [{ title: 'Audit / Stock Opname', href: '/audits' }],
};

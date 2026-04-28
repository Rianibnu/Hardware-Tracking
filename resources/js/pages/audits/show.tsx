import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, CheckCircle2, AlertCircle, HelpCircle, XCircle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditShow({ audit, details, stats }: any) {
    const [filter, setFilter] = useState('all');
    const { data, setData, post, processing } = useForm({
        asset_code: '',
    });

    const { post: completePost, processing: completeProcessing } = useForm();

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.asset_code.trim()) return;

        post(`/audits/${audit.id}/scan`, {
            preserveScroll: true,
            onSuccess: () => setData('asset_code', ''),
        });
    };

    const handleComplete = () => {
        if (confirm('Apakah Anda yakin ingin menyelesaikan audit ini? Aset yang belum discan akan ditandai sebagai hilang.')) {
            completePost(`/audits/${audit.id}/complete`);
        }
    };

    const progressPercentage = stats.total > 0 ? Math.round(((stats.found + stats.wrong_location) / stats.total) * 100) : 0;

    const filteredDetails = details.filter((d: any) => {
        if (filter === 'all') return true;
        return d.status === filter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'expected': return <Badge variant="outline" className="text-muted-foreground"><HelpCircle className="w-3 h-3 mr-1" /> Belum Discan</Badge>;
            case 'found': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Ditemukan</Badge>;
            case 'missing': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Hilang</Badge>;
            case 'wrong_location': return <Badge variant="warning" className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="w-3 h-3 mr-1" /> Salah Lokasi</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <>
            <Head title={`Audit - ${audit.location?.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={'/audits'}>
                            <Button variant="outline" size="icon">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Audit: {audit.location?.name}</h1>
                            <p className="text-muted-foreground">
                                {new Date(audit.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {' '}• Status: <Badge variant={audit.status === 'ongoing' ? 'secondary' : 'default'}>{audit.status === 'ongoing' ? 'Sedang Berjalan' : 'Selesai'}</Badge>
                            </p>
                        </div>
                    </div>
                    {audit.status === 'ongoing' && (
                        <Button variant="default" onClick={handleComplete} disabled={completeProcessing}>
                            Selesaikan Audit
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Progress Scan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{progressPercentage}%</div>
                            <Progress value={progressPercentage} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-2">{stats.found + stats.wrong_location} dari {stats.total} aset terscan</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ditemukan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.found}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Belum Discan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.expected}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Salah Lokasi / Ekstra</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.wrong_location}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {audit.status === 'ongoing' && (
                        <Card className="md:col-span-1 border-primary/50 shadow-sm">
                            <CardHeader>
                                <CardTitle>Scan Aset</CardTitle>
                                <CardDescription>Gunakan barcode scanner atau ketik kode manual</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleScan} className="space-y-4">
                                    <div className="space-y-2">
                                        <Input
                                            autoFocus
                                            placeholder="Kode Aset..."
                                            value={data.asset_code}
                                            onChange={(e) => setData('asset_code', e.target.value)}
                                            className="text-lg py-6"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={processing || !data.asset_code}>
                                        Scan
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter>
                                <p className="text-sm text-muted-foreground">Tip: Jika menggunakan USB scanner, pastikan kursor berada di kotak input di atas.</p>
                            </CardFooter>
                        </Card>
                    )}

                    <Card className={audit.status === 'ongoing' ? 'md:col-span-2' : 'md:col-span-3'}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Daftar Aset</CardTitle>
                                <CardDescription>Aset yang tercatat di lokasi ini.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Semua</Button>
                                <Button size="sm" variant={filter === 'expected' ? 'default' : 'outline'} onClick={() => setFilter('expected')}>Belum Discan</Button>
                                <Button size="sm" variant={filter === 'found' ? 'default' : 'outline'} onClick={() => setFilter('found')}>Ditemukan</Button>
                                <Button size="sm" variant={filter === 'wrong_location' ? 'default' : 'outline'} onClick={() => setFilter('wrong_location')}>Salah Lokasi</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Aset</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead>Status Scan</TableHead>
                                            <TableHead>Waktu Scan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDetails.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    Tidak ada data.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredDetails.map((detail: any) => (
                                                <TableRow key={detail.id}>
                                                    <TableCell className="font-mono">{detail.asset?.code}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {detail.asset?.name}
                                                        {detail.notes && <p className="text-xs text-muted-foreground">{detail.notes}</p>}
                                                    </TableCell>
                                                    <TableCell>{detail.asset?.category?.name}</TableCell>
                                                    <TableCell>{getStatusBadge(detail.status)}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {detail.scanned_at ? new Date(detail.scanned_at).toLocaleTimeString('id-ID') : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AuditShow.layout = {
    breadcrumbs: [
        { title: 'Audit / Stock Opname', href: '/audits' },
        { title: 'Detail Audit', href: '#' },
    ],
};

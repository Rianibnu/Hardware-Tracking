import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { SortableTableHead } from '@/components/sortable-table-head';
import type { PaginatedResponse, ServiceRecord } from '@/types/inventory';
import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Wrench } from 'lucide-react';

interface Props {
    records: PaginatedResponse<ServiceRecord>;
    filters: { status?: string; sort?: string; dir?: string };
}

export default function ServiceIndex({ records, filters }: Props) {
    const handleSort = (field: string, dir: 'asc' | 'desc') => {
        router.get(
            '/services',
            {
                status: filters?.status,
                sort: field,
                dir,
            },
            { preserveState: true, replace: true }
        );
    };

    return (
        <>
            <Head title="Riwayat Servis Pihak Ketiga" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Servis Pihak Ketiga</h1>
                        <p className="text-muted-foreground">Catatan perbaikan aset yang ditangani oleh vendor eksternal.</p>
                    </div>
                </div>

                <Card className="flex-1 border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Daftar Servis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {records.data.length === 0 ? (
                            <div className="flex h-40 flex-col items-center justify-center text-center">
                                <ExternalLink className="text-muted-foreground/50 mb-2 h-10 w-10" />
                                <p className="text-muted-foreground">Belum ada catatan servis pihak ketiga.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode Asset</TableHead>
                                            <SortableTableHead field="vendor_name" label="Vendor" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} />
                                            <TableHead>Kendala</TableHead>
                                            <SortableTableHead field="status" label="Status" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} />
                                            <SortableTableHead field="cost" label="Biaya" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} />
                                            <TableHead>Tgl Selesai / Est.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {records.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <Link href={`/assets/${record.asset_id}`} className="font-medium text-blue-600 hover:underline">
                                                        {record.asset?.code ?? `Asset #${record.asset_id}`}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="font-medium">{record.vendor_name}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={record.service_description}>
                                                    {record.service_description}
                                                </TableCell>
                                                <TableCell>
                                                    {record.status === 'in_progress' ? (
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-500/15 text-amber-600">
                                                            Sedang Diservis
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-500/15 text-emerald-600">
                                                            Selesai
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {record.cost
                                                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(record.cost))
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {record.status === 'completed'
                                                        ? (record.completed_at ? new Date(record.completed_at).toLocaleDateString('id-ID') : '-')
                                                        : (record.estimated_completion_date ? `Est: ${new Date(record.estimated_completion_date).toLocaleDateString('id-ID')}` : '-')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {records.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <div className="flex gap-2">
                            {records.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 rounded-md border text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

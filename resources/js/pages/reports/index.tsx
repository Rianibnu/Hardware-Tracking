import { useState, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/sortable-table-head';
import { Download, Upload, Search, FilterX, Users, AlertTriangle, Wrench, MapPin, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const REPORT_TYPES = [
    { value: 'technicians', label: 'Kerjaan Teknisi', icon: Users },
    { value: 'tickets', label: 'Laporan Kerusakan', icon: AlertTriangle },
    { value: 'services', label: 'Laporan Service', icon: Wrench },
    { value: 'assets', label: 'Mapping Asset', icon: MapPin },
]; 

const ASSET_STATUS_LABELS: Record<string, string> = {
    available: 'Tersedia',
    in_use: 'Digunakan',
    maintenance: 'Maintenance',
    broken: 'Rusak',
    disposed: 'Dibuang',
};

const TICKET_STATUS_LABELS: Record<string, string> = {
    open: 'Terbuka',
    progress: 'Dikerjakan',
    done: 'Selesai',
    closed: 'Ditutup',
};

const SERVICE_STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu',
    in_progress: 'Dikerjakan',
    completed: 'Selesai',
};

const statusLabel = (type: string, status: string) => {
    if (type === 'assets') return ASSET_STATUS_LABELS[status] ?? status;
    if (type === 'services') return SERVICE_STATUS_LABELS[status] ?? status;
    return TICKET_STATUS_LABELS[status] ?? status;
};

export default function ReportIndex() {
    const { type, filters, data, technicians, categories, flash } = usePage<any>().props;
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: formData, setData } = useForm({
        type: type || 'tickets',
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        technician_id: filters?.technician_id || 'all',
        category_id: filters?.category_id || 'all',
    });

    const handleFilter = (e?: React.FormEvent, sortField?: string, sortDir?: string) => {
        if (e) e.preventDefault();
        const q: any = { type: formData.type };
        if (formData.start_date) q.start_date = formData.start_date;
        if (formData.end_date) q.end_date = formData.end_date;
        if (formData.technician_id !== 'all') q.technician_id = formData.technician_id;
        if (formData.category_id !== 'all') q.category_id = formData.category_id;
        if (sortField) q.sort = sortField;
        else if (filters?.sort) q.sort = filters.sort;
        if (sortDir) q.dir = sortDir;
        else if (filters?.dir) q.dir = filters.dir;
        router.get('/reports', q, { preserveState: true });
    };

    const handleSort = (field: string, dir: 'asc' | 'desc') => {
        handleFilter(undefined, field, dir);
    };

    const handleExport = () => {
        const p: any = { type: formData.type };
        if (formData.start_date) p.start_date = formData.start_date;
        if (formData.end_date) p.end_date = formData.end_date;
        if (formData.technician_id !== 'all') p.technician_id = formData.technician_id;
        if (formData.category_id !== 'all') p.category_id = formData.category_id;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/reports/export';
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrf) {
            const t = document.createElement('input');
            t.type = 'hidden'; t.name = '_token'; t.value = csrf;
            form.appendChild(t);
        }
        Object.keys(p).forEach(k => {
            const i = document.createElement('input');
            i.type = 'hidden'; i.name = k; i.value = p[k];
            form.appendChild(i);
        });
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const switchType = (val: string) => {
        setData('type', val);
        router.get('/reports', { type: val }, { preserveState: true });
    };

    const resetFilter = () => {
        setData({ type: formData.type, start_date: '', end_date: '', technician_id: 'all', category_id: 'all' });
        router.get('/reports', { type: formData.type });
    };

    const handleImport = () => {
        if (!importFile) return;
        setImporting(true);
        const fd = new FormData();
        fd.append('file', importFile);
        router.post('/reports/import', fd as any, {
            forceFormData: true,
            onFinish: () => {
                setImporting(false);
                setImportFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const fmtDate = (d: string | null) => {
        if (!d) return '-';
        try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
    };

    return (
        <>
            <Head title="Laporan & Export" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold">Laporan Sistem</h1>
                    <p className="text-muted-foreground text-sm">Monitor dan unduh laporan kinerja teknisi, kerusakan aset, riwayat servis, dan pemetaan aset.</p>
                </div>

                {/* Report Type Selector — horizontal buttons */}
                <div className="flex flex-wrap gap-2">
                    {REPORT_TYPES.map(rt => (
                        <Button
                            key={rt.value}
                            variant={formData.type === rt.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => switchType(rt.value)}
                            className="gap-2"
                        >
                            <rt.icon className="h-4 w-4" />
                            {rt.label}
                        </Button>
                    ))}
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                        <XCircle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Import Section — hanya tampil pada tab Mapping Asset */}
                {formData.type === 'assets' && (
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Import Data Asset dari Excel
                            </CardTitle>
                            <CardDescription>Upload file Excel (.xlsx) untuk menambahkan asset secara massal. Kategori, Merek, dan Lokasi baru akan otomatis dibuat.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-center gap-3">
                                <a href="/reports/template" className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                    Download Template
                                </a>
                                <div className="flex items-center gap-2">
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="max-w-xs text-sm"
                                        onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                                    />
                                    <Button
                                        size="sm"
                                        disabled={!importFile || importing}
                                        onClick={handleImport}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {importing ? (
                                            <><span className="animate-spin mr-1">⏳</span> Mengimpor...</>
                                        ) : (
                                            <><Upload className="mr-1 h-4 w-4" /> Import</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filter */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filter Laporan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Periode Mulai</label>
                                <Input type="date" value={formData.start_date} onChange={e => setData('start_date', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Periode Akhir</label>
                                <Input type="date" value={formData.end_date} onChange={e => setData('end_date', e.target.value)} />
                            </div>
                            {formData.type !== 'assets' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Teknisi / PIC</label>
                                    <Select value={formData.technician_id} onValueChange={v => setData('technician_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Semua Teknisi" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Teknisi</SelectItem>
                                            {technicians.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Kategori Aset</label>
                                <Select value={formData.category_id} onValueChange={v => setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Kategori</SelectItem>
                                        {categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" variant="secondary" size="sm"><Search className="mr-1 h-4 w-4" />Cari</Button>
                                <Button type="button" variant="outline" size="sm" onClick={resetFilter}><FilterX className="h-4 w-4" /></Button>
                                <Button type="button" size="sm" onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Download className="mr-1 h-4 w-4" />Excel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Preview Data</CardTitle>
                        <CardDescription>Menampilkan {data?.data?.length ?? 0} dari total {data?.total ?? 0} data. Export untuk mengunduh seluruhnya.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {formData.type === 'technicians' && <><TableHead>Teknisi</TableHead><SortableTableHead field="title" label="Ticket" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><TableHead>Aset</TableHead><SortableTableHead field="status" label="Status" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><SortableTableHead field="updated_at" label="Tgl Update" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /></>}
                                    {formData.type === 'tickets' && <><SortableTableHead field="id" label="#" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><SortableTableHead field="title" label="Masalah" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><TableHead>Aset</TableHead><TableHead>Teknisi</TableHead><SortableTableHead field="status" label="Status" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><SortableTableHead field="created_at" label="Tgl Lapor" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /></>}
                                    {formData.type === 'services' && <><SortableTableHead field="vendor_name" label="Vendor" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><TableHead>Aset</TableHead><SortableTableHead field="cost" label="Biaya" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><SortableTableHead field="status" label="Status" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><SortableTableHead field="completed_at" label="Tgl Selesai" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /></>}
                                    {formData.type === 'assets' && <><SortableTableHead field="code" label="Kode" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><SortableTableHead field="name" label="Nama" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /><TableHead>Kategori</TableHead><TableHead>Lokasi</TableHead><SortableTableHead field="status" label="Status" currentSort={filters?.sort} currentDir={filters?.dir} onSort={handleSort} /></>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(!data?.data || data.data.length === 0) ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
                                ) : data.data.map((r: any) => (
                                    <TableRow key={r.id}>
                                        {formData.type === 'technicians' && <><TableCell className="font-medium">{r.assignee?.name || '-'}</TableCell><TableCell>{r.title}</TableCell><TableCell>{r.asset?.name}</TableCell><TableCell><span className="text-xs font-semibold">{statusLabel('tickets', r.status)}</span></TableCell><TableCell>{fmtDate(r.updated_at)}</TableCell></>}
                                        {formData.type === 'tickets' && <><TableCell className="font-mono text-xs">#{r.id}</TableCell><TableCell>{r.title}</TableCell><TableCell>{r.asset?.name}</TableCell><TableCell>{r.assignee?.name || '-'}</TableCell><TableCell><span className="text-xs font-semibold">{statusLabel('tickets', r.status)}</span></TableCell><TableCell>{fmtDate(r.created_at)}</TableCell></>}
                                        {formData.type === 'services' && <><TableCell className="font-medium">{r.vendor_name}</TableCell><TableCell>{r.asset?.name}</TableCell><TableCell>{r.cost ? `Rp ${Number(r.cost).toLocaleString()}` : '-'}</TableCell><TableCell><span className="text-xs font-semibold">{statusLabel('services', r.status)}</span></TableCell><TableCell>{fmtDate(r.completed_at)}</TableCell></>}
                                        {formData.type === 'assets' && <><TableCell className="font-mono text-xs">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.category?.name}</TableCell><TableCell>{r.location?.name}</TableCell><TableCell><span className="text-xs font-semibold">{statusLabel('assets', r.status)}</span></TableCell></>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {data?.last_page > 1 && (
                        <div className="p-4 border-t border-border/50 flex items-center justify-center gap-1">
                            {data.links.map((link: any, i: number) => (
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

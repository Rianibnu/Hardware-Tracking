import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Asset, Category, Location, Ticket, TicketStatus, User } from '@/types/inventory';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, ExternalLink, MessageSquare, Send, UserCheck, Wrench } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_COLORS: Record<TicketStatus, string> = {
    open: 'bg-red-500/15 text-red-600 border-red-200',
    progress: 'bg-amber-500/15 text-amber-600 border-amber-200',
    done: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    closed: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    progress: 'In Progress',
    done: 'Done',
    closed: 'Closed',
};

interface Props {
    ticket: Ticket & { logs: { id: number; note: string; status_from: string | null; status_to: string | null; creator: { name: string; role: string }; created_at: string }[] };
    teknisiList: User[];
    auth: { user: { id: number; role: string } };
}

export default function TicketShow({ ticket, teknisiList, auth }: Props) {
    const isAdmin = auth.user.role === 'admin';
    const isTeknisi = auth.user.role === 'teknisi';
    const isAssignee = ticket.assigned_to === auth.user.id;
    const canSelfAssign = isTeknisi && !ticket.assigned_to && ticket.status === 'open';
    const [actionLoading, setActionLoading] = useState(false);
    const [serviceCost, setServiceCost] = useState('0');
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

    const assignForm = useForm({ assigned_to: String(ticket.assigned_to ?? ''), note: '' });
    const actionForm = useForm({ note: '' });
    const serviceForm = useForm({
        asset_id: ticket.asset_id,
        ticket_id: ticket.id,
        vendor_name: '',
        service_description: '',
        estimated_completion_date: '',
        cost: '',
    });

    const activeService = ticket.service_records?.find(s => s.status === 'in_progress');

    function handleAssign(e: React.FormEvent) {
        e.preventDefault();
        assignForm.post(`/tickets/${ticket.id}/assign`, {
            onSuccess: () => router.reload(),
        });
    }

    function handleAction(action: 'progress' | 'done' | 'close') {
        if (action === 'done' && !actionForm.data.note) {
            alert('Catatan hasil perbaikan wajib diisi!');
            return;
        }
        actionForm.post(`/tickets/${ticket.id}/${action}`, {
            onSuccess: () => {
                actionForm.reset();
                router.reload();
            },
            onError: (err) => {
                console.error('Validation error:', err);
                toast.error('Gagal: ' + Object.values(err).join('\n'));
            }
        });
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.visit('/tickets')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold">{ticket.title}</h1>
                        <Badge variant="outline" className={STATUS_COLORS[ticket.status]}>
                            {STATUS_LABELS[ticket.status]}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Ticket #{ticket.id} · {new Date(ticket.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Detail + Log */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Info */}
                    <Card className="border-border/50">
                        <CardContent className="pt-5">
                            <p className="mb-4 text-sm leading-relaxed">{ticket.description}</p>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Asset</dt>
                                    <dd
                                        className="mt-0.5 cursor-pointer font-medium underline-offset-2 hover:underline"
                                        onClick={() => ticket.asset && router.visit(`/assets/${ticket.asset.id}`)}
                                    >
                                        {ticket.asset?.name ?? '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Prioritas</dt>
                                    <dd className="mt-0.5 font-medium capitalize">{ticket.priority}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Dilaporkan oleh</dt>
                                    <dd className="mt-0.5 font-medium">
                                        {ticket.reporter?.name ?? (ticket as any).reporter_name ?? '—'}
                                        {!ticket.reporter && (ticket as any).reporter_name && (
                                            <span className="text-muted-foreground text-xs ml-1">(Publik)</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Ditangani oleh</dt>
                                    <dd className="mt-0.5 font-medium">{ticket.assignee?.name ?? 'Belum di-assign'}</dd>
                                </div>
                                {ticket.resolved_at && (
                                    <div>
                                        <dt className="text-muted-foreground">Diselesaikan</dt>
                                        <dd className="mt-0.5 font-medium">
                                            {new Date(ticket.resolved_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Ticket Log */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="h-4 w-4" />
                                Riwayat Aktivitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative space-y-4">
                                <div className="absolute top-0 left-4 h-full w-px bg-border" />
                                {ticket.logs.map((log) => (
                                    <div key={log.id} className="relative flex gap-4 pl-10">
                                        <div className="bg-background border-border absolute -left-0.5 h-4 w-4 rounded-full border-2" />
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-semibold">{log.creator?.name}</span>
                                                <span className="text-muted-foreground capitalize">{log.creator?.role}</span>
                                                {log.status_from && log.status_to && log.status_from !== log.status_to && (
                                                    <span className="text-muted-foreground">
                                                        · {log.status_from} → {log.status_to}
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground ml-auto">
                                                    {new Date(log.created_at).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm">{log.note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions Panel */}
                <div className="space-y-4">
                    {/* Self-assign for Teknisi */}
                    {canSelfAssign && (
                        <Card className="border-blue-500/20 bg-blue-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-blue-600">
                                    <UserCheck className="h-4 w-4" />
                                    Ticket Tersedia
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-3 text-sm">
                                    Ticket ini belum ada yang menangani. Ambil untuk langsung dikerjakan.
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        assignForm.transform((data) => ({
                                            ...data,
                                            assigned_to: String(auth.user.id),
                                            note: 'Diambil langsung oleh teknisi',
                                        }));
                                        assignForm.post(`/tickets/${ticket.id}/assign`, {
                                            data: { assigned_to: String(auth.user.id), note: 'Diambil langsung oleh teknisi' },
                                            onSuccess: () => router.reload(),
                                        });
                                    }}
                                    disabled={assignForm.processing}
                                >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Ambil Ticket Ini
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Status Actions */}
                    {(isAssignee || isAdmin) && ticket.status !== 'closed' && !activeService && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Aksi Ticket</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="action-note">
                                        Catatan{ticket.status === 'progress' ? ' (wajib untuk Done)' : ''}
                                    </Label>
                                    <textarea
                                        id="action-note"
                                        value={actionForm.data.note}
                                        onChange={(e) => actionForm.setData('note', e.target.value)}
                                        placeholder="Tuliskan hasil pekerjaan atau catatan..."
                                        rows={3}
                                        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none"
                                    />
                                </div>

                                {ticket.status === 'open' && (
                                    <Button className="w-full" onClick={() => handleAction('progress')}>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Mulai Pekerjaan
                                    </Button>
                                )}

                                {ticket.status === 'progress' && (
                                    <Button className="w-full" onClick={() => handleAction('done')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Tandai Selesai
                                    </Button>
                                )}

                                {(isAdmin || isAssignee) && ticket.status === 'done' && (
                                    <Button variant="outline" className="w-full" onClick={() => handleAction('close')}>
                                        Tutup Ticket
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Third-party Service Active */}
                    {activeService && (
                        <Card className="border-amber-500/20 bg-amber-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                                    <ExternalLink className="h-4 w-4" />
                                    Sedang Diservis (Pihak Ke-3)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Vendor:</span> {activeService.vendor_name}
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Deskripsi:</span> {activeService.service_description}
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Est. Selesai:</span>{' '}
                                    {activeService.estimated_completion_date
                                        ? new Date(activeService.estimated_completion_date).toLocaleDateString('id-ID')
                                        : 'Tidak ada'}
                                </div>
                                {(isAdmin || isAssignee) && (
                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            className="w-full text-amber-600 hover:text-amber-700"
                                            onClick={() => setIsServiceDialogOpen(true)}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Tandai Servis Selesai
                                        </Button>
                                        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Selesaikan Servis Pihak Ketiga</DialogTitle>
                                                    <DialogDescription>
                                                        Masukkan biaya perbaikan dari vendor (biarkan 0 jika tidak ada biaya).
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="cost">Biaya (Rp)</Label>
                                                        <Input
                                                            id="cost"
                                                            type="number"
                                                            value={serviceCost}
                                                            onChange={(e) => setServiceCost(e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Batal</Button>
                                                    <Button onClick={() => {
                                                        router.post(`/services/${activeService.id}/complete`, { cost: serviceCost, note: 'Diselesaikan dari halaman ticket' }, {
                                                            onSuccess: () => {
                                                                setIsServiceDialogOpen(false);
                                                                router.reload();
                                                            },
                                                            onError: (err) => {
                                                                console.error('Validation errors:', err);
                                                                toast.error('Gagal: ' + Object.values(err).join(', '));
                                                            }
                                                        });
                                                    }}>
                                                        Konfirmasi Selesai
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Third-party Service Action */}
                    {(isAssignee || isAdmin) && ticket.status === 'progress' && !activeService && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wrench className="h-4 w-4" />
                                    Servis Pihak Ketiga
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        serviceForm.post('/services', {
                                            onSuccess: () => {
                                                serviceForm.reset();
                                                router.reload();
                                            },
                                            onError: (err) => {
                                                console.error('Validation error:', err);
                                                toast.error('Gagal Alihkan: ' + Object.values(err).join('\n'));
                                            }
                                        });
                                    }}
                                    className="space-y-3"
                                >
                                    <div className="space-y-1.5">
                                        <Label htmlFor="vendor_name">Nama Vendor / Tempat Servis</Label>
                                        <Input
                                            id="vendor_name"
                                            value={serviceForm.data.vendor_name}
                                            onChange={(e) => serviceForm.setData('vendor_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="service_description">Kendala / Deskripsi</Label>
                                        <textarea
                                            id="service_description"
                                            value={serviceForm.data.service_description}
                                            onChange={(e) => serviceForm.setData('service_description', e.target.value)}
                                            required
                                            rows={2}
                                            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="estimated_completion_date">Estimasi Selesai (Opsional)</Label>
                                        <Input
                                            id="estimated_completion_date"
                                            type="date"
                                            value={serviceForm.data.estimated_completion_date}
                                            onChange={(e) => serviceForm.setData('estimated_completion_date', e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" variant="secondary" className="w-full" disabled={serviceForm.processing}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Alihkan ke Pihak ke-3
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Assign (Admin only) */}
                    {isAdmin && ticket.status !== 'closed' && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserCheck className="h-4 w-4" />
                                    Assign Teknisi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAssign} className="space-y-3">
                                    <Select
                                        value={assignForm.data.assigned_to}
                                        onValueChange={(v) => assignForm.setData('assigned_to', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih teknisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teknisiList.map((t) => (
                                                <SelectItem key={t.id} value={String(t.id)}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        value={assignForm.data.note}
                                        onChange={(e) => assignForm.setData('note', e.target.value)}
                                        placeholder="Catatan assign (opsional)"
                                    />
                                    <Button type="submit" variant="outline" className="w-full" disabled={assignForm.processing}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Assign
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

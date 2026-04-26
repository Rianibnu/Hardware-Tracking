import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Asset, AssetStatus } from '@/types/inventory';
import { router } from '@inertiajs/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertTriangle, CheckCircle, QrCode, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_COLORS: Record<AssetStatus, string> = {
    available: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    in_use: 'bg-blue-500/15 text-blue-600 border-blue-200',
    maintenance: 'bg-amber-500/15 text-amber-600 border-amber-200',
    broken: 'bg-red-500/15 text-red-600 border-red-200',
    disposed: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
};

const STATUS_LABELS: Record<AssetStatus, string> = {
    available: 'Tersedia',
    in_use: 'Digunakan',
    maintenance: 'Maintenance',
    broken: 'Rusak',
    disposed: 'Dibuang',
};

export default function ScanQR() {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanning, setScanning] = useState(true);
    const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!scanning) return;

        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
            false,
        );

        scanner.render(
            async (decodedText) => {
                scanner.clear();
                setScanning(false);
                setLoading(true);
                setError(null);

                try {
                    // Extract code from URL if QR contains full URL
                    const code = decodedText.includes('/scan/')
                        ? decodedText.split('/scan/').pop()!
                        : decodedText;

                    const resp = await fetch(`/api/assets/code/${code}`, {
                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        credentials: 'same-origin',
                    });

                    if (!resp.ok) {
                        setError('Asset tidak ditemukan. Pastikan QR code valid.');
                        return;
                    }

                    const asset: Asset = await resp.json();
                    setScannedAsset(asset);
                } catch {
                    setError('Gagal memuat data asset. Periksa koneksi internet.');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                // ignore scan errors (camera not found etc handled by html5-qrcode)
            },
        );

        scannerRef.current = scanner;
        return () => {
            scanner.clear().catch(() => {});
        };
    }, [scanning]);

    function reset() {
        setScannedAsset(null);
        setError(null);
        setScanning(true);
    }

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                        <QrCode className="text-primary h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Scan QR Code</h1>
                    <p className="text-muted-foreground text-sm">Arahkan kamera ke QR code pada label asset</p>
                </div>

                {scanning && (
                    <Card className="border-border/50 overflow-hidden">
                        <CardContent className="p-0">
                            <div id="qr-reader" className="w-full" />
                        </CardContent>
                    </Card>
                )}

                {loading && (
                    <Card className="border-border/50">
                        <CardContent className="flex items-center justify-center gap-3 py-8">
                            <RefreshCw className="text-muted-foreground h-5 w-5 animate-spin" />
                            <span className="text-sm">Memuat data asset...</span>
                        </CardContent>
                    </Card>
                )}

                {error && !loading && (
                    <Card className="border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20">
                        <CardContent className="py-6 text-center">
                            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-500" />
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Scan Ulang
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {scannedAsset && !loading && (
                    <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                        <CardContent className="py-6">
                            <div className="mb-4 flex items-start gap-3">
                                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="font-semibold">{scannedAsset.name}</p>
                                    <p className="text-muted-foreground text-xs">{scannedAsset.code}</p>
                                </div>
                                <Badge variant="outline" className={STATUS_COLORS[scannedAsset.status]}>
                                    {STATUS_LABELS[scannedAsset.status]}
                                </Badge>
                            </div>
                            <div className="text-muted-foreground mb-4 text-xs">
                                <p>Kategori: {scannedAsset.category?.name ?? '—'}</p>
                                <p>Lokasi: {scannedAsset.location?.name ?? '—'}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => router.visit(`/assets/${scannedAsset.id}`)}>Lihat Detail Asset</Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.visit(`/tickets/create?asset_id=${scannedAsset.id}`)}
                                >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Laporkan Masalah
                                </Button>
                                <Button variant="ghost" size="sm" onClick={reset}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Scan Lagi
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

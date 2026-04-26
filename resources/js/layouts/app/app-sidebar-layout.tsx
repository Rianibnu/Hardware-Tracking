import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { usePage, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage();
    const { auth } = page.props;

    useEffect(() => {
        if (auth?.user && window.Echo) {
            const channel = window.Echo.private('system')
                .listen('SystemDataUpdated', (e: any) => {
                    // Refresh data apapun yang ada di halaman saat ini
                    // Pertahankan state (form input) dan posisi scroll
                    router.reload({ preserveScroll: true, preserveState: true });
                });

            return () => {
                channel.stopListening('SystemDataUpdated');
                window.Echo.leave('system');
            };
        }
    }, [auth?.user]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}

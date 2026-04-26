import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Package, QrCode, TicketCheck, Database, Folder, MapPin, Tag, Wrench, FileSpreadsheet, UserCog } from 'lucide-react';

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const { setOpenMobile } = useSidebar();
    const isAdmin = auth?.user?.role === 'admin';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Asset Inventory',
            href: '/assets',
            icon: Package,
        },
        {
            title: 'Ticketing',
            href: '/tickets',
            icon: TicketCheck,
        },
        {
            title: 'Servis Pihak 3',
            href: '/services',
            icon: Wrench,
        },
        {
            title: 'Laporan',
            href: '/reports',
            icon: FileSpreadsheet,
        },
        {
            title: 'Scan QR',
            href: '/scan-qr',
            icon: QrCode,
        },
    ];

    const masterDataItems: NavItem[] = [
        {
            title: 'Kategori',
            href: '/categories',
            icon: Folder,
        },
        {
            title: 'Lokasi',
            href: '/locations',
            icon: MapPin,
        },
        {
            title: 'Brand',
            href: '/brands',
            icon: Tag,
        },
    ];

    if (isAdmin) {
        masterDataItems.push({
            title: 'Manajemen User',
            href: '/users',
            icon: UserCog,
        });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild onClick={() => setOpenMobile(false)}>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavMain items={masterDataItems} title="Master Data" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

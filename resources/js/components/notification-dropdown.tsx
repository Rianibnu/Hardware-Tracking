import { Link, usePage, router } from '@inertiajs/react';
import { Bell, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NotificationDropdown() {
    const page = usePage();
    const { auth } = page.props;
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/notifications/json');
            const data = await res.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (e) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        if (auth?.user) {
            fetchNotifications();
            
            if (window.Echo) {
                window.Echo.private(`App.Models.User.${auth.user.id}`)
                    .listen('NotificationSent', (e: any) => {
                        setNotifications((prev) => [e.notification, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    });
            }
            
            // Optionally poll every 60 seconds as fallback
            const interval = setInterval(fetchNotifications, 60000);
            return () => {
                clearInterval(interval);
                if (window.Echo) {
                    window.Echo.leave(`App.Models.User.${auth.user.id}`);
                }
            };
        }
    }, [auth?.user]);

    const markAsRead = async (id: number) => {
        try {
            await fetch(`/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                },
            });
            fetchNotifications();
        } catch (e) {
            // Error
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                },
            });
            fetchNotifications();
        } catch (e) {
            // Error
        }
    };

    if (!auth?.user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative group h-9 w-9 cursor-pointer"
                >
                    <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center pointer-events-none text-[10px]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span>Notifikasi</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} Baru
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                            className="text-xs font-normal text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                            Tandai baca semua
                        </button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-neutral-500">
                            Tidak ada notifikasi.
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem 
                                key={notif.id} 
                                className={`flex flex-col items-start p-3 focus:bg-neutral-100 dark:focus:bg-neutral-800 ${!notif.read_at ? 'bg-neutral-50 dark:bg-neutral-800/50' : ''} ${notif.link ? 'cursor-pointer' : 'cursor-default'}`}
                                onClick={() => {
                                    if (!notif.read_at) {
                                        markAsRead(notif.id);
                                    }
                                    if (notif.link) {
                                        router.visit(notif.link);
                                    }
                                }}
                            >
                                <div className="flex justify-between w-full items-start gap-2">
                                    <div className={`font-medium text-sm ${notif.link ? 'hover:text-blue-600 transition-colors' : ''}`}>
                                        {notif.title}
                                    </div>
                                    {!notif.read_at && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notif.id);
                                            }}
                                            className="text-neutral-400 hover:text-blue-500 transition-colors"
                                            title="Tandai sudah dibaca"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-neutral-500 mt-1">
                                    {notif.message}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

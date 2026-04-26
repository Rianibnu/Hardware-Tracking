import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { PageProps } from '@/types';

export function FlashMessages() {
    const { flash } = usePage<PageProps & { flash: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return null;
}

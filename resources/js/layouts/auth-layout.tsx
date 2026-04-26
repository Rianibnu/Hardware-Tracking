import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { FlashMessages } from '@/components/flash-messages';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description}>
            <FlashMessages />
            {children}
        </AuthLayoutTemplate>
    );
}

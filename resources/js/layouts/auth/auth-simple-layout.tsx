import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Server } from 'lucide-react';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 relative">
            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    {/* Logo + Title */}
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-3 font-medium group"
                        >
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                                <Server className="h-6 w-6 text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-bold text-foreground">{title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                        {children}
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[10px] text-muted-foreground/50">
                        © {new Date().getFullYear()} Monitoring Inventaris IT
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Search, Package, Ticket as TicketIcon } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ assets: any[], tickets: any[] }>({ assets: [], tickets: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (!query) {
            setResults({ assets: [], tickets: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (url: string) => {
        setOpen(false);
        router.visit(url);
    };

    return (
        <>
            <Button
                variant="outline"
                className="relative hidden md:flex h-9 w-40 lg:w-64 justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none pr-12"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Cari aset atau ticket...</span>
                <span className="inline-flex lg:hidden">Cari...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.4rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 shrink-0"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput 
                    placeholder="Ketik untuk mencari aset atau ticket..." 
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {loading ? 'Mencari...' : query ? 'Tidak ada hasil ditemukan.' : 'Ketik sesuatu untuk mulai mencari.'}
                    </CommandEmpty>
                    
                    {results.assets.length > 0 && (
                        <CommandGroup heading="Assets">
                            {results.assets.map((asset) => (
                                <CommandItem
                                    key={`asset-${asset.id}`}
                                    onSelect={() => handleSelect(`/assets/${asset.id}`)}
                                    className="flex items-center gap-2"
                                >
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span>{asset.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {asset.code} • {asset.status}
                                            {asset.location && ` • 📍 ${asset.location.name}`}
                                            {asset.category && ` • 🏷️ ${asset.category.name}`}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.tickets.length > 0 && (
                        <CommandGroup heading="Tickets">
                            {results.tickets.map((ticket) => (
                                <CommandItem
                                    key={`ticket-${ticket.id}`}
                                    onSelect={() => handleSelect(`/tickets/${ticket.id}`)}
                                    className="flex items-center gap-2"
                                >
                                    <TicketIcon className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="truncate">{ticket.title}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {ticket.asset?.name ? `${ticket.asset.name} • ` : ''}{ticket.status}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}

import { TableHead } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

interface Props {
    label: string;
    field: string;
    currentSort?: string;
    currentDir?: 'asc' | 'desc' | string;
    onSort: (field: string, dir: 'asc' | 'desc') => void;
    className?: string;
}

export function SortableTableHead({ label, field, currentSort, currentDir, onSort, className }: Props) {
    const isSorted = currentSort === field;
    
    const handleClick = () => {
        if (!isSorted) {
            onSort(field, 'asc');
        } else if (currentDir === 'asc') {
            onSort(field, 'desc');
        } else {
            onSort(field, 'asc');
        }
    };

    return (
        <TableHead 
            className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${className}`} 
            onClick={handleClick}
        >
            <div className="flex items-center gap-1">
                {label}
                {isSorted ? (
                    currentDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100" />
                )}
            </div>
        </TableHead>
    );
}

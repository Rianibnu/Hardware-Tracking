export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'teknisi';
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    description: string | null;
}

export interface Brand {
    id: number;
    name: string;
    description: string | null;
}

export interface Location {
    id: number;
    name: string;
    building: string | null;
    floor: string | null;
    room: string | null;
    description: string | null;
}

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'broken' | 'disposed';
export type TicketStatus = 'open' | 'progress' | 'done' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Asset {
    id: number;
    code: string;
    name: string;
    category_id: number;
    serial_number: string | null;
    ip_address: string | null;
    ram_capacity: string | null;
    windows_license: string | null;
    office_license: string | null;
    pic: string | null;
    photo_url: string | null;
    brand_id: number | null;
    model: string | null;
    purchase_year: number | null;
    status: AssetStatus;
    location_id: number;
    notes: string | null;
    category?: Category;
    brand?: Brand;
    location?: Location;
    tickets?: Ticket[];
    created_at: string;
    updated_at: string;
}

export interface Ticket {
    id: number;
    asset_id: number;
    reported_by: number;
    assigned_to: number | null;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    resolved_at: string | null;
    asset?: Asset;
    reporter?: User;
    assignee?: User | null;
    logs?: TicketLog[];
    serviceRecords?: ServiceRecord[];
    created_at: string;
    updated_at: string;
}

export interface TicketLog {
    id: number;
    ticket_id: number;
    note: string;
    status_from: string | null;
    status_to: string | null;
    created_by: number;
    creator?: User;
    created_at: string;
}

export interface AssetLog {
    id: number;
    asset_id: number;
    action: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    created_by: number;
    creator?: User;
    created_at: string;
}

export interface ServiceRecord {
    id: number;
    asset_id: number;
    ticket_id: number | null;
    vendor_name: string;
    service_description: string;
    estimated_completion_date: string | null;
    cost: number | null;
    status: 'in_progress' | 'completed' | 'cancelled';
    created_by: number;
    completed_by: number | null;
    completed_at: string | null;
    asset?: Asset;
    creator?: User;
    completer?: User;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

// Consumable Stock Management
export interface Consumable {
    id: number;
    name: string;
    sku: string | null;
    category_id: number | null;
    unit: string;
    current_stock: number;
    min_stock: number;
    description: string | null;
    stock_status: 'safe' | 'low' | 'empty';
    category?: Category;
    created_at: string;
    updated_at: string;
}

export interface ConsumableTransaction {
    id: number;
    consumable_id: number;
    type: 'in' | 'out';
    quantity: number;
    unit_price: number | null;
    supplier: string | null;
    request_id: number | null;
    distributed_to: number | null;
    location_id: number | null;
    notes: string | null;
    created_by: number;
    consumable?: Consumable;
    recipient?: User;
    location?: Location;
    creator?: User;
    request?: ConsumableRequest;
    created_at: string;
    updated_at: string;
}

export interface ConsumableRequest {
    id: number;
    consumable_id: number;
    quantity: number;
    requested_by: number | null;
    public_requester_name: string | null;
    public_requester_email: string | null;
    location_id: number | null;
    reason: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
    approved_by: number | null;
    approved_at: string | null;
    rejected_reason: string | null;
    consumable?: Consumable;
    requester?: User;
    approver?: User;
    location?: Location;
    created_at: string;
    updated_at: string;
}


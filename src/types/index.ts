// src/types/index.ts - Updated Types

export type AdminRole = 'super_admin' | 'admin';

export type AdminPermissions = {
    inventory: boolean;
    waiters: boolean;
    tables: boolean;
    orders: boolean;
    analytics: boolean;
    settings: boolean;
};

export type Admin = {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    profile_pic?: string | null;
    role: AdminRole;
    permissions: AdminPermissions;
    is_active: boolean;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
};

// Inventory Category
export type InventoryCategory = {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

// Inventory Item (Updated)
export type InventoryItem = {
    id: string;
    category_id?: string | null;
    name: string;
    description?: string | null;
    sku?: string | null;
    barcode?: string | null;
    quantity: number;
    unit: string;
    reorder_level: number;
    purchase_price: number;
    selling_price?: number | null;
    supplier_name?: string | null;
    supplier_contact?: string | null;
    storage_location?: string | null;
    expiry_date?: string | null;
    is_active: boolean;
    last_restocked?: string | null;
    created_at: string;
    updated_at: string;
    // Computed fields (from view)
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    total_value?: number;
    is_low_stock?: boolean;
};

// Inventory Transaction
export type InventoryTransactionType = 'purchase' | 'usage' | 'adjustment' | 'waste' | 'return';

export type InventoryTransaction = {
    id: string;
    item_id: string;
    transaction_type: InventoryTransactionType;
    quantity: number;
    unit_price?: number | null;
    total_amount?: number | null;
    reference_number?: string | null;
    notes?: string | null;
    performed_by?: string | null;
    created_at: string;
};

export type Waiter = {
    id: string;
    name: string;
    profile_pic: string | null;
    phone: string | null;
    email?: string | null;
    total_orders: number;
    total_revenue: number;
    average_rating: number;
    is_active: boolean;
    is_on_duty: boolean;
    shift_start?: string | null;
    shift_end?: string | null;
    created_at: string;
    updated_at: string;
};

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export type RestaurantTable = {
    id: string;
    table_number: number;
    capacity: number;
    status: TableStatus;
    current_waiter_id: string | null;
    current_order_id?: string | null;
    section?: string | null;
    position_x?: number | null;
    position_y?: number | null;
    created_at: string;
    updated_at: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type Order = {
    id: string;
    order_number: string;
    table_id: string | null;
    waiter_id: string | null;
    status: OrderStatus;
    order_type: 'dine-in' | 'takeaway' | 'delivery';
    subtotal: number;
    tax: number;
    discount: number;
    total_amount: number;
    payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded';
    payment_method?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    special_instructions?: string | null;
    placed_at: string;
    completed_at?: string | null;
    created_at: string;
};
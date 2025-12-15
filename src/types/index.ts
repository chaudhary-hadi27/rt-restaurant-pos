// types/index.ts

export type AdminRole = 'super_admin' | 'admin';

export type AdminPermissions = {
    inventory: boolean;
    waiters: boolean;
    tables: boolean;
    analytics: boolean;
};

export type Admin = {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    permissions: AdminPermissions;
    is_active: boolean;
    created_at: string;
};

export type Waiter = {
    id: string;
    name: string;
    profile_pic: string | null;
    phone: string | null;
    total_orders: number;
    total_revenue: number;
    is_active: boolean;
    created_at: string;
};

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export type RestaurantTable = {
    id: string;
    table_number: number;
    capacity: number;
    status: TableStatus;
    current_waiter_id: string | null;
    created_at: string;
};

export type InventoryItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    reorder_level: number;
    created_at: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed';

export type Order = {
    id: string;
    order_number: string;
    table_id: string | null;
    waiter_id: string | null;
    total_amount: number;
    status: OrderStatus;
    created_at: string;
};
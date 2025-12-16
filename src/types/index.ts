// Simplified Types - Only Essential Fields

export type Admin = {
    id: string
    email: string
    name: string
    phone?: string
    role: 'super_admin' | 'admin'
    permissions: Record<string, boolean>
    is_active: boolean
    created_at: string
}

export type InventoryItem = {
    id: string
    name: string
    quantity: number
    unit: string
    reorder_level: number
    purchase_price: number
    category_id?: string
    supplier_name?: string
    is_active: boolean
    created_at: string
}

export type Waiter = {
    id: string
    name: string
    phone?: string
    profile_pic?: string
    total_orders: number
    total_revenue: number
    is_active: boolean
    is_on_duty: boolean
    created_at: string
}

export type Table = {
    id: string
    table_number: number
    capacity: number
    status: 'available' | 'occupied' | 'reserved' | 'cleaning'
    section?: string
    waiter_id?: string
    created_at: string
}

export type MenuItem = {
    id: string
    category_id: string
    name: string
    description?: string
    price: number
    image_url?: string
    is_available: boolean
    created_at: string
}

export type Order = {
    id: string
    table_id?: string
    waiter_id?: string
    status: 'pending' | 'preparing' | 'completed' | 'cancelled'
    subtotal: number
    tax: number
    total_amount: number
    created_at: string
}
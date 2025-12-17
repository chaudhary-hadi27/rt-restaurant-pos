// src/types/index.ts - SINGLE SOURCE OF TRUTH FOR ALL TYPES

// ============================================
// ADMIN TYPES
// ============================================
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

// ============================================
// INVENTORY TYPES
// ============================================
export type InventoryCategory = {
    id: string
    name: string
    icon: string
    display_order: number
    is_active: boolean
    created_at: string
}

export type InventoryItem = {
    id: string
    category_id?: string
    name: string
    description?: string
    image_url?: string
    quantity: number
    unit: string
    reorder_level: number
    purchase_price: number
    supplier_name?: string
    storage_location?: string
    is_active: boolean
    created_at: string
    updated_at: string
    // Computed/joined fields
    category_name?: string
    category_icon?: string
    total_value?: number
}

export type StockStatus = 'critical' | 'low' | 'medium' | 'high'

// ============================================
// STAFF TYPES
// ============================================
export type EmployeeType = 'waiter' | 'chef' | 'manager' | 'cashier' | 'cleaner'

export type Waiter = {
    id: string
    name: string
    phone?: string
    cnic?: string
    employee_type: EmployeeType
    profile_pic?: string
    total_orders: number
    total_revenue: number
    avg_rating?: number
    is_active: boolean
    is_on_duty: boolean
    created_at: string
}

export type WaiterShift = {
    id: string
    waiter_id: string
    clock_in: string
    clock_out?: string
    created_at: string
}

// ============================================
// TABLE TYPES
// ============================================
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export type Table = {
    id: string
    table_number: number
    capacity: number
    section?: string
    status: TableStatus
    waiter_id?: string
    current_order_id?: string
    created_at: string
}

// ============================================
// MENU TYPES
// ============================================
export type MenuCategory = {
    id: string
    name: string
    icon: string
    display_order: number
    is_active: boolean
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
    preparation_time?: number
    created_at: string
}

export type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
    image_url?: string
}

// ============================================
// ORDER TYPES
// ============================================
export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled'
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served'

export type Order = {
    id: string
    table_id?: string
    waiter_id?: string
    status: OrderStatus
    subtotal: number
    tax: number
    total_amount: number
    notes?: string
    created_at: string
    updated_at: string
}

export type OrderItem = {
    id: string
    order_id: string
    menu_item_id: string
    quantity: number
    unit_price: number
    total_price: number
    notes?: string
    status: OrderItemStatus
    created_at: string
}
// src/types/menu.ts

export type MenuCategory = {
    id: string;
    name: string;
    icon: string;
    display_order: number;
};

export type MenuItem = {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    preparation_time?: number;
};

export type CartItem = {
    id: string;
    item: MenuItem;
    quantity: number;
    notes?: string;
};

export type OrderItem = {
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served';
};


export const DB_NAME = 'rt_restaurant_db'
export const DB_VERSION = 1

export const STORES = {
    MENU_ITEMS: 'menu_items',
    MENU_CATEGORIES: 'menu_categories',
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    SYNC_QUEUE: 'sync_queue',
    CART: 'cart',
    SETTINGS: 'settings'
}

export type SyncQueueItem = {
    id: string
    action: 'create' | 'update' | 'delete'
    table: string
    data: any
    timestamp: number
    status: 'pending' | 'syncing' | 'failed'
    retries: number
}
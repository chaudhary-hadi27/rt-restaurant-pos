// src/lib/db/offlineManager.ts - FIXED VERSION
import { createClient } from '@/lib/supabase/client'
import { db } from './indexedDB'
import { STORES } from './schema'

interface DownloadResult {
    success: boolean
    message?: string
    counts?: { categories: number; items: number; tables: number; waiters: number }
    error?: string
}

interface StorageInfo {
    used: number
    limit: number
    percentage: number
    hasData: boolean
    ordersCount: number
    menuItemsCount: number
    breakdown: { menu: number; orders: number; images: number; total: number }
}

class OfflineManager {
    private isDownloading = false
    private syncInProgress = false
    private autoCleanupInterval: NodeJS.Timeout | null = null

    constructor() {
        if (typeof window !== 'undefined') {
            this.initAutoCleanup()
            this.initAutoSync()
        }
    }

    // ✅ AUTO-CLEANUP: Runs every 6 hours
    private initAutoCleanup() {
        this.cleanupOldData()
        this.autoCleanupInterval = setInterval(() => {
            this.cleanupOldData()
        }, 6 * 60 * 60 * 1000)
    }

    // ✅ AUTO-SYNC: When online, sync every 15 minutes
    private initAutoSync() {
        if (navigator.onLine) {
            this.downloadEssentialData()
        }

        window.addEventListener('online', () => {
            this.downloadEssentialData()
            this.syncPendingOrders()
        })

        setInterval(() => {
            if (navigator.onLine) {
                this.downloadEssentialData()
            }
        }, 15 * 60 * 1000)
    }

    // ✅ DOWNLOAD ESSENTIAL DATA - PUBLIC METHOD
    async downloadEssentialData(force = false): Promise<DownloadResult> {
        if (this.isDownloading) return { success: false, message: 'Already downloading...' }

        const lastSync = localStorage.getItem('menu_last_sync')
        const oneHour = 60 * 60 * 1000

        if (!force && lastSync && Date.now() - parseInt(lastSync) < oneHour) {
            return { success: true, message: 'Menu is fresh' }
        }

        this.isDownloading = true
        const supabase = createClient()

        try {
            console.log('📥 Auto-syncing essential data...')

            const [categories, items, tables, waiters] = await Promise.allSettled([
                supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
                supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
                supabase.from('restaurant_tables').select('*').order('table_number'),
                supabase.from('waiters').select('*').eq('is_active', true).order('name')
            ])

            const categoriesData = categories.status === 'fulfilled' ? categories.value.data || [] : []
            const itemsData = items.status === 'fulfilled' ? items.value.data || [] : []
            const tablesData = tables.status === 'fulfilled' ? tables.value.data || [] : []
            const waitersData = waiters.status === 'fulfilled' ? waiters.value.data || [] : []

            if (categoriesData.length > 0) {
                await db.bulkPut(STORES.MENU_CATEGORIES, categoriesData)
                await db.put(STORES.SETTINGS, {
                    key: 'categories_version',
                    value: Date.now()
                })
            }

            if (itemsData.length > 0) {
                await db.bulkPut(STORES.MENU_ITEMS, itemsData)
                await db.put(STORES.SETTINGS, {
                    key: 'menu_version',
                    value: Date.now()
                })
            }

            if (tablesData.length > 0) {
                await db.put(STORES.SETTINGS, { key: 'tables', value: tablesData })
            }

            if (waitersData.length > 0) {
                await db.put(STORES.SETTINGS, { key: 'waiters', value: waitersData })
            }

            const imageUrls = itemsData
                .map(i => i.image_url)
                .filter(Boolean)
                .slice(0, 30)

            if (imageUrls.length > 0 && navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CACHE_IMAGES',
                    urls: imageUrls
                })
            }

            localStorage.setItem('menu_last_sync', Date.now().toString())
            localStorage.setItem('offline_ready', 'true')

            console.log('✅ Data synced:', {
                items: itemsData.length,
                categories: categoriesData.length
            })

            return {
                success: true,
                counts: {
                    categories: categoriesData.length,
                    items: itemsData.length,
                    tables: tablesData.length,
                    waiters: waitersData.length
                }
            }
        } catch (error: any) {
            console.error('❌ Sync failed:', error)
            return { success: false, error: error.message }
        } finally {
            this.isDownloading = false
        }
    }

    // ✅ OFFLINE CLEANUP ONLY: 7-day cache + max 200 orders
    async cleanupOldData(): Promise<number> {
        try {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
            const orders = await db.getAll(STORES.ORDERS) as any[]

            if (!Array.isArray(orders) || orders.length === 0) {
                console.log('📦 No offline orders to cleanup')
                return 0
            }

            const oldOrders = orders.filter(o => {
                const orderTime = new Date(o.created_at).getTime()
                return orderTime < sevenDaysAgo && o.status === 'completed'
            })

            const sortedOrders = orders
                .filter(o => o.status === 'completed')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            const ordersToDelete = sortedOrders.slice(200)
            const allDeletes = [...new Set([...oldOrders, ...ordersToDelete])]

            for (const order of allDeletes) {
                await db.delete(STORES.ORDERS, order.id)

                const items = await db.getAll(STORES.ORDER_ITEMS) as any[]
                if (Array.isArray(items)) {
                    const orderItems = items.filter(i => i.order_id === order.id)
                    for (const item of orderItems) {
                        await db.delete(STORES.ORDER_ITEMS, item.id)
                    }
                }
            }

            if (allDeletes.length > 0) {
                console.log(`🧹 Cleaned ${allDeletes.length} old orders from OFFLINE cache`)
            }

            return allDeletes.length
        } catch (error) {
            console.error('Offline cleanup error:', error)
            return 0
        }
    }

    // ✅ DELETE OLD HISTORY - PUBLIC METHOD (for admin settings)
    async deleteOldHistory(type: 'monthly' | 'yearly'): Promise<{ success: boolean; deleted: number }> {
        try {
            const days = type === 'monthly' ? 30 : 365
            const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000)

            const orders = await db.getAll(STORES.ORDERS) as any[]

            if (!Array.isArray(orders) || orders.length === 0) {
                return { success: true, deleted: 0 }
            }

            const oldOrders = orders.filter(o => {
                const orderTime = new Date(o.created_at).getTime()
                return orderTime < cutoffDate && o.status === 'completed'
            })

            for (const order of oldOrders) {
                await db.delete(STORES.ORDERS, order.id)

                const items = await db.getAll(STORES.ORDER_ITEMS) as any[]
                if (Array.isArray(items)) {
                    const orderItems = items.filter(i => i.order_id === order.id)
                    for (const item of orderItems) {
                        await db.delete(STORES.ORDER_ITEMS, item.id)
                    }
                }
            }

            console.log(`🗑️ Deleted ${oldOrders.length} orders older than ${type === 'monthly' ? '30' : '365'} days`)
            return { success: true, deleted: oldOrders.length }
        } catch (error: any) {
            console.error('Delete history error:', error)
            return { success: false, deleted: 0 }
        }
    }

    // ✅ AUTO-SYNC PENDING ORDERS
    async syncPendingOrders(): Promise<{ success: boolean; synced: number }> {
        if (this.syncInProgress || !navigator.onLine) {
            return { success: false, synced: 0 }
        }

        this.syncInProgress = true
        let syncedCount = 0

        try {
            const orders = await db.getAll(STORES.ORDERS) as any[]

            if (!Array.isArray(orders)) {
                console.warn('⚠️ Orders is not an array')
                return { success: false, synced: 0 }
            }

            const pendingOrders = orders.filter(o => !o.synced)

            const supabase = createClient()

            for (const order of pendingOrders) {
                try {
                    const { error } = await supabase
                        .from('orders')
                        .insert(order)

                    if (!error) {
                        await db.put(STORES.ORDERS, { ...order, synced: true })
                        syncedCount++
                    }
                } catch (err) {
                    console.error('Failed to sync order:', order.id, err)
                }
            }

            console.log(`✅ Auto-synced ${syncedCount}/${pendingOrders.length} orders`)
            return { success: true, synced: syncedCount }
        } catch (error) {
            console.error('Sync error:', error)
            return { success: false, synced: syncedCount }
        } finally {
            this.syncInProgress = false
        }
    }

    // ✅ SAFE DATA RETRIEVAL
    async getOfflineData(store: string): Promise<any[]> {
        try {
            if (store === 'restaurant_tables' || store === 'waiters') {
                const data = await db.get(STORES.SETTINGS, store) as { value?: any[] } | undefined
                return Array.isArray(data?.value) ? data.value : []
            }
            const data = await db.getAll(store)
            return Array.isArray(data) ? data : []
        } catch (error) {
            console.error(`Error getting ${store}:`, error)
            return []
        }
    }

    // ✅ STORAGE INFO
    async getStorageInfo(): Promise<StorageInfo> {
        try {
            const [orders, menuItems, menuVersion] = await Promise.all([
                db.getAll(STORES.ORDERS) as Promise<any[]>,
                db.getAll(STORES.MENU_ITEMS) as Promise<any[]>,
                db.get(STORES.SETTINGS, 'menu_version')
            ])

            const safeOrders = Array.isArray(orders) ? orders : []
            const safeMenuItems = Array.isArray(menuItems) ? menuItems : []

            const menuSize = safeMenuItems.length * 2
            const ordersSize = safeOrders.length * 5
            const imagesSize = safeMenuItems.filter(i => i.image_url).length * 100

            const estimate = await navigator.storage?.estimate?.() || { usage: 0, quota: 0 }
            const used = Math.round((estimate.usage || 0) / 1024 / 1024)
            const limit = Math.round((estimate.quota || 0) / 1024 / 1024)

            const hasData = await this.isOfflineReady()
            const dataAge = menuVersion ? Date.now() - (menuVersion as any).value : Infinity
            const isFresh = dataAge < 24 * 60 * 60 * 1000

            return {
                used,
                limit,
                percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
                hasData: hasData && isFresh,
                ordersCount: safeOrders.length,
                menuItemsCount: safeMenuItems.length,
                breakdown: {
                    menu: menuSize,
                    orders: ordersSize,
                    images: imagesSize,
                    total: menuSize + ordersSize + imagesSize
                }
            }
        } catch (error) {
            return {
                used: 0,
                limit: 0,
                percentage: 0,
                hasData: false,
                ordersCount: 0,
                menuItemsCount: 0,
                breakdown: { menu: 0, orders: 0, images: 0, total: 0 }
            }
        }
    }

    async isOfflineReady(): Promise<boolean> {
        const ready = localStorage.getItem('offline_ready') === 'true'
        if (!ready) return false

        const [categories, items] = await Promise.all([
            db.getAll(STORES.MENU_CATEGORIES),
            db.getAll(STORES.MENU_ITEMS)
        ])

        return Array.isArray(categories) && categories.length > 0 &&
            Array.isArray(items) && items.length > 0
    }

    async clearAllData(includeMenu = false): Promise<void> {
        const storesToClear = [STORES.ORDERS, STORES.ORDER_ITEMS, STORES.CART, STORES.SYNC_QUEUE]

        if (includeMenu) {
            storesToClear.push(STORES.MENU_ITEMS, STORES.MENU_CATEGORIES)
            localStorage.removeItem('offline_ready')
        }

        await Promise.all(storesToClear.map(store => db.clear(store)))
        console.log(`🗑️ Cleared data (menu ${includeMenu ? 'included' : 'preserved'})`)
    }

    destroy() {
        if (this.autoCleanupInterval) {
            clearInterval(this.autoCleanupInterval)
        }
    }
}

export const offlineManager = new OfflineManager()

// ✅ Auto-cleanup on app start
if (typeof window !== 'undefined') {
    offlineManager.cleanupOldData()

    window.addEventListener('online', () => {
        offlineManager.syncPendingOrders()
    })
}
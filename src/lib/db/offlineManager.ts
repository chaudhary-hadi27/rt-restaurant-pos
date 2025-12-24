// src/lib/db/offlineManager.ts - FINAL PRODUCTION VERSION
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

    // ✅ ALWAYS download menu (permanent cache)
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
            console.log('📥 Syncing menu data...')

            const [categories, items, tables, waiters] = await Promise.all([
                supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
                supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
                supabase.from('restaurant_tables').select('*').order('table_number'),
                supabase.from('waiters').select('*').eq('is_active', true).order('name')
            ])

            const categoriesData = categories.data || []
            const itemsData = items.data || []
            const tablesData = tables.data || []
            const waitersData = waiters.data || []

            // ✅ Store permanently in IndexedDB
            if (categoriesData.length > 0) await db.bulkPut(STORES.MENU_CATEGORIES, categoriesData)
            if (itemsData.length > 0) await db.bulkPut(STORES.MENU_ITEMS, itemsData)
            if (tablesData.length > 0) await db.put(STORES.SETTINGS, { key: 'tables', value: tablesData })
            if (waitersData.length > 0) await db.put(STORES.SETTINGS, { key: 'waiters', value: waitersData })

            // Cache images via Service Worker
            const imageUrls = itemsData.map(i => i.image_url).filter(Boolean)
            if (imageUrls.length > 0 && navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CACHE_IMAGES',
                    urls: imageUrls
                })
            }

            localStorage.setItem('menu_last_sync', Date.now().toString())
            localStorage.setItem('offline_ready', 'true')

            console.log('✅ Menu synced:', { items: itemsData.length, categories: categoriesData.length })

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

    // ✅ Smart cleanup - Keep menu, delete old orders (7 days)
    async cleanupOldData(): Promise<number> {
        try {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
            const orders = await db.getAll(STORES.ORDERS) as any[]

            const oldOrders = orders.filter(o => {
                const orderTime = new Date(o.created_at).getTime()
                return orderTime < sevenDaysAgo && o.status === 'completed'
            })

            for (const order of oldOrders) {
                await db.delete(STORES.ORDERS, order.id)

                // Delete related items
                const items = await db.getAll(STORES.ORDER_ITEMS) as any[]
                const orderItems = items.filter(i => i.order_id === order.id)
                for (const item of orderItems) {
                    await db.delete(STORES.ORDER_ITEMS, item.id)
                }
            }

            if (oldOrders.length > 0) {
                console.log(`🧹 Cleaned ${oldOrders.length} old orders (>7 days)`)
            }

            return oldOrders.length
        } catch (error) {
            console.error('Cleanup error:', error)
            return 0
        }
    }

    // ✅ Delete menu item (local + Supabase + Cloudinary)
    async deleteMenuItem(id: string, imageUrl?: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Delete from IndexedDB
            await db.delete(STORES.MENU_ITEMS, id)

            // Delete from Supabase if online
            if (navigator.onLine) {
                const supabase = createClient()
                const { error } = await supabase.from('menu_items').delete().eq('id', id)
                if (error) throw error

                // Delete from Cloudinary
                if (imageUrl?.includes('cloudinary')) {
                    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0]
                    await fetch('/api/upload/cloudinary', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ public_id: publicId })
                    }).catch(err => console.warn('Cloudinary delete failed:', err))
                }
            }

            console.log('✅ Menu item deleted:', id)
            return { success: true }
        } catch (error: any) {
            console.error('Delete error:', error)
            return { success: false, error: error.message }
        }
    }

    // ✅ Admin: Delete old history (monthly/yearly)
    async deleteOldHistory(type: 'monthly' | 'yearly'): Promise<{ success: boolean; deleted: number }> {
        try {
            const cutoffDays = type === 'monthly' ? 30 : 365
            const cutoffTime = Date.now() - (cutoffDays * 24 * 60 * 60 * 1000)

            const orders = await db.getAll(STORES.ORDERS) as any[]
            const oldOrders = orders.filter(o => {
                const orderTime = new Date(o.created_at).getTime()
                return orderTime < cutoffTime
            })

            for (const order of oldOrders) {
                await db.delete(STORES.ORDERS, order.id)

                const items = await db.getAll(STORES.ORDER_ITEMS) as any[]
                const orderItems = items.filter(i => i.order_id === order.id)
                for (const item of orderItems) {
                    await db.delete(STORES.ORDER_ITEMS, item.id)
                }
            }

            // Also delete from Supabase if online
            if (navigator.onLine) {
                const supabase = createClient()
                const cutoffDate = new Date(cutoffTime).toISOString()

                await supabase.from('order_items').delete()
                    .in('order_id', oldOrders.map(o => o.id))

                await supabase.from('orders').delete()
                    .lt('created_at', cutoffDate)
            }

            console.log(`🗑️ Deleted ${oldOrders.length} ${type} orders`)
            return { success: true, deleted: oldOrders.length }
        } catch (error) {
            console.error('History delete error:', error)
            return { success: false, deleted: 0 }
        }
    }

    // ✅ Get offline data with type safety
    async getOfflineData(store: string): Promise<any[]> {
        try {
            if (store === 'restaurant_tables' || store === 'waiters') {
                const data = await db.get(STORES.SETTINGS, store) as { value?: any[] } | undefined
                return data?.value || []
            }
            const data = await db.getAll(store)
            return Array.isArray(data) ? data : []
        } catch (error) {
            console.error(`Error getting ${store}:`, error)
            return []
        }
    }

    // ✅ Check if offline ready
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

    // ✅ Clear all data (keep menu by default)
    async clearAllData(includeMenu = false): Promise<void> {
        const storesToClear = [STORES.ORDERS, STORES.ORDER_ITEMS, STORES.CART, STORES.SYNC_QUEUE]

        if (includeMenu) {
            storesToClear.push(STORES.MENU_ITEMS, STORES.MENU_CATEGORIES)
            localStorage.removeItem('offline_ready')
        }

        await Promise.all(storesToClear.map(store => db.clear(store)))
        console.log(`🗑️ Cleared data (menu ${includeMenu ? 'included' : 'preserved'})`)
    }

    // ✅ Get storage info
    async getStorageInfo(): Promise<StorageInfo> {
        try {
            const [orders, menuItems] = await Promise.all([
                db.getAll(STORES.ORDERS) as Promise<any[]>,
                db.getAll(STORES.MENU_ITEMS) as Promise<any[]>
            ])

            const menuSize = (menuItems?.length || 0) * 2
            const ordersSize = (orders?.length || 0) * 5
            const imagesSize = (menuItems?.filter(i => i.image_url)?.length || 0) * 100

            const estimate = await navigator.storage?.estimate?.() || { usage: 0, quota: 0 }
            const used = Math.round((estimate.usage || 0) / 1024 / 1024)
            const limit = Math.round((estimate.quota || 0) / 1024 / 1024)

            return {
                used,
                limit,
                percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
                hasData: await this.isOfflineReady(),
                ordersCount: orders?.length || 0,
                menuItemsCount: menuItems?.length || 0,
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
}

export const offlineManager = new OfflineManager()

// ✅ Auto-cleanup on app start
if (typeof window !== 'undefined') {
    offlineManager.cleanupOldData()
}
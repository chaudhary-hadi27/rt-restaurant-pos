// src/lib/db/offlineManager.ts
import { createClient } from '@/lib/supabase/client'
import { db } from './indexedDB'
import { STORES } from './schema'
import { smartStorage, STORAGE_LIMITS } from './storageStrategy'

interface DownloadResult {
    success: boolean
    message?: string
    counts?: {
        categories: number
        items: number
        tables: number
        waiters: number
    }
    error?: string
}

interface StorageInfo {
    used: number
    limit: number
    percentage: number
    hasData: boolean
    ordersCount: number
    menuItemsCount: number
    breakdown: {
        menu: number
        orders: number
        images: number
        total: number
    }
}

class OfflineManager {
    private isDownloading = false

    // ✅ Download essential data (menu ALWAYS cached)
    async downloadEssentialData(force = false): Promise<DownloadResult> {
        if (this.isDownloading) {
            return { success: false, message: 'Already downloading...' }
        }

        // Check if data is fresh (unless forced)
        if (!force && await smartStorage.isDataFresh('menu')) {
            return { success: true, message: 'Data is fresh' }
        }

        this.isDownloading = true
        const supabase = createClient()

        try {
            console.log('📥 Downloading essential data for all devices...')

            // ✅ ALWAYS fetch menu (core business data)
            const [categories, items, tables, waiters] = await Promise.all([
                supabase
                    .from('menu_categories')
                    .select('id, name, icon, display_order, is_active')
                    .eq('is_active', true)
                    .order('display_order'),

                supabase
                    .from('menu_items')
                    .select('id, name, price, category_id, description, image_url, is_available')
                    .eq('is_available', true)
                    .order('name'),

                supabase
                    .from('restaurant_tables')
                    .select('id, table_number, section, capacity, status')
                    .order('table_number'),

                supabase
                    .from('waiters')
                    .select('id, name, phone, employee_type, is_active')
                    .eq('is_active', true)
                    .order('name')
            ])

            // ✅ FIXED: Type-safe data handling
            const categoriesData = categories.data || []
            const itemsData = items.data || []
            const tablesData = tables.data || []
            const waitersData = waiters.data || []

            // Store in IndexedDB
            if (categoriesData.length > 0) {
                await db.bulkPut(STORES.MENU_CATEGORIES, categoriesData)
            }

            if (itemsData.length > 0) {
                // ✅ Cache images based on device/network
                const shouldCache = smartStorage.shouldCacheImages()
                if (shouldCache) {
                    const imageUrls = itemsData
                        .map(item => item.image_url)
                        .filter((url): url is string => Boolean(url))

                    if (imageUrls.length > 0) {
                        this.cacheImages(imageUrls)
                    }
                }

                await db.bulkPut(STORES.MENU_ITEMS, itemsData)
            }

            if (tablesData.length > 0) {
                await db.put(STORES.SETTINGS, {
                    key: 'tables',
                    value: tablesData
                })
            }

            if (waitersData.length > 0) {
                await db.put(STORES.SETTINGS, {
                    key: 'waiters',
                    value: waitersData
                })
            }

            // Update metadata
            await smartStorage.updateMeta('menu', itemsData.length)
            await smartStorage.updateMeta('tables', tablesData.length)
            await smartStorage.updateMeta('waiters', waitersData.length)

            // Clean old data (keep history optimized)
            const cleaned = await smartStorage.cleanOldOrders()
            if (cleaned > 0) {
                console.log(`♻️ Auto-cleaned ${cleaned} old orders`)
            }

            const counts = {
                categories: categoriesData.length,
                items: itemsData.length,
                tables: tablesData.length,
                waiters: waitersData.length
            }

            console.log('✅ Data synced:', counts)

            return {
                success: true,
                counts,
                message: `Synced ${counts.items} menu items`
            }

        } catch (error: any) {
            console.error('❌ Download failed:', error)
            return {
                success: false,
                error: error.message || 'Download failed'
            }
        } finally {
            this.isDownloading = false
        }
    }

    // ✅ Cache images via Service Worker
    private cacheImages(urls: string[]): void {
        if (!navigator.serviceWorker?.controller) return

        // Only cache valid Cloudinary URLs
        const validUrls = urls.filter(url =>
            url &&
            typeof url === 'string' &&
            url.includes('cloudinary')
        )

        if (validUrls.length === 0) return

        navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_IMAGES',
            urls: validUrls
        })

        console.log(`🖼️ Caching ${validUrls.length} images`)
    }

    // ✅ FIXED: Get offline data with type safety
    async getOfflineData(store: string): Promise<any[]> {
        try {
            if (store === 'restaurant_tables' || store === 'waiters') {
                const data = await db.get(STORES.SETTINGS, store) as { value?: any[] } | undefined
                return data?.value || []
            }

            const data = await db.getAll(store)
            return Array.isArray(data) ? data : []
        } catch (error) {
            console.error(`Error getting offline data for ${store}:`, error)
            return []
        }
    }

    // ✅ FIXED: Check if offline data exists
    async hasOfflineData(): Promise<boolean> {
        try {
            const [categories, items] = await Promise.all([
                db.getAll(STORES.MENU_CATEGORIES) as Promise<any[]>,
                db.getAll(STORES.MENU_ITEMS) as Promise<any[]>
            ])

            const hasCategories = Array.isArray(categories) && categories.length > 0
            const hasItems = Array.isArray(items) && items.length > 0

            return hasCategories && hasItems
        } catch (error) {
            console.error('Error checking offline data:', error)
            return false
        }
    }

    // ✅ Clear all offline data (keep menu by default)
    async clearAllData(includeMenu = false): Promise<void> {
        const storesToClear = [
            STORES.ORDERS,
            STORES.ORDER_ITEMS,
            STORES.CART,
            STORES.SYNC_QUEUE
        ]

        if (includeMenu) {
            storesToClear.push(STORES.MENU_ITEMS, STORES.MENU_CATEGORIES)
        }

        await Promise.all(
            storesToClear.map(store => db.clear(store))
        )

        console.log(`🗑️ Cleared offline data (menu ${includeMenu ? 'included' : 'preserved'})`)
    }

    // ✅ FIXED: Get complete storage info
    async getStorageInfo(): Promise<StorageInfo> {
        try {
            const [size, hasData, orders, menuItems, breakdown] = await Promise.all([
                smartStorage.getStorageSize(),
                this.hasOfflineData(),
                db.getAll(STORES.ORDERS) as Promise<any[]>,
                db.getAll(STORES.MENU_ITEMS) as Promise<any[]>,
                smartStorage.getStorageBreakdown()
            ])

            return {
                ...size,
                hasData,
                ordersCount: Array.isArray(orders) ? orders.length : 0,
                menuItemsCount: Array.isArray(menuItems) ? menuItems.length : 0,
                breakdown
            }
        } catch (error) {
            console.error('Error getting storage info:', error)
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
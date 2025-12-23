import { createClient } from '@/lib/supabase/client'
import { db } from './indexedDB'
import { STORES } from './schema'

class OfflineManager {
    private isDownloading = false
    private lastSync: number = 0
    private SYNC_INTERVAL = 3600000 // 1 hour

    // ✅ Check if data needs refresh
    private needsSync(): boolean {
        const lastSyncData = localStorage.getItem('last_data_sync')
        if (!lastSyncData) return true

        this.lastSync = parseInt(lastSyncData)
        return Date.now() - this.lastSync > this.SYNC_INTERVAL
    }

    // ✅ Download all essential data
    async downloadEssentialData(force = false) {
        if (this.isDownloading) return { success: false, message: 'Already downloading' }
        if (!force && !this.needsSync()) return { success: true, message: 'Data is fresh' }

        this.isDownloading = true
        const supabase = createClient()

        try {
            console.log('📥 Downloading essential data...')

            // Parallel fetch
            const [categories, items, tables, waiters] = await Promise.all([
                supabase.from('menu_categories').select('*').eq('is_active', true),
                supabase.from('menu_items').select('*').eq('is_available', true),
                supabase.from('restaurant_tables').select('*').order('table_number'),
                supabase.from('waiters').select('id, name, phone, profile_pic, employee_type').eq('is_active', true)
            ])

            // Store in IndexedDB
            if (categories.data) await db.bulkPut(STORES.MENU_CATEGORIES, categories.data)
            if (items.data) {
                await db.bulkPut(STORES.MENU_ITEMS, items.data)
                // ✅ Cache images
                this.cacheImages(items.data.map(i => i.image_url).filter(Boolean))
            }
            if (tables.data) await db.bulkPut(STORES.SETTINGS, [{ key: 'tables', value: tables.data }])
            if (waiters.data) await db.bulkPut(STORES.SETTINGS, [{ key: 'waiters', value: waiters.data }])

            // Update last sync
            localStorage.setItem('last_data_sync', Date.now().toString())
            this.lastSync = Date.now()

            console.log('✅ Data downloaded:', {
                categories: categories.data?.length || 0,
                items: items.data?.length || 0,
                tables: tables.data?.length || 0,
                waiters: waiters.data?.length || 0
            })

            return {
                success: true,
                counts: {
                    categories: categories.data?.length || 0,
                    items: items.data?.length || 0,
                    tables: tables.data?.length || 0,
                    waiters: waiters.data?.length || 0
                }
            }
        } catch (error: any) {
            console.error('❌ Download failed:', error)
            return { success: false, error: error.message }
        } finally {
            this.isDownloading = false
        }
    }

    // ✅ Cache images via Service Worker
    private async cacheImages(urls: string[]) {
        if (!navigator.serviceWorker?.controller) return

        navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_IMAGES',
            urls: urls.filter(url => url && url.includes('cloudinary'))
        })
    }

    // ✅ Get offline data
    async getOfflineData(store: string) {
        if (store === 'restaurant_tables' || store === 'waiters') {
            const data = await db.get(STORES.SETTINGS, store)
            return (data as { value?: any })?.value || []
        }
        return await db.getAll(store) || []
    }

    // ✅ Check if offline data exists
    async hasOfflineData(): Promise<boolean> {
        try {
            const [categories, items] = await Promise.all([
                db.getAll(STORES.MENU_CATEGORIES),
                db.getAll(STORES.MENU_ITEMS)
            ])
            return (Array.isArray(categories) ? categories.length : 0) > 0 &&
                (Array.isArray(items) ? items.length : 0) > 0

        } catch {
            return false
        }
    }
}

export const offlineManager = new OfflineManager()
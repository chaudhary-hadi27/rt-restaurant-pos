import { DB_NAME, DB_VERSION, STORES } from './schema'

class IndexedDBManager {
    private db: IDBDatabase | null = null

    async init() {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve(request.result)
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result

                // Menu Items
                if (!db.objectStoreNames.contains(STORES.MENU_ITEMS)) {
                    const store = db.createObjectStore(STORES.MENU_ITEMS, { keyPath: 'id' })
                    store.createIndex('category_id', 'category_id')
                }

                // Menu Categories
                if (!db.objectStoreNames.contains(STORES.MENU_CATEGORIES)) {
                    db.createObjectStore(STORES.MENU_CATEGORIES, { keyPath: 'id' })
                }

                // Orders
                if (!db.objectStoreNames.contains(STORES.ORDERS)) {
                    const store = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' })
                    store.createIndex('synced', 'synced')
                    store.createIndex('created_at', 'created_at')
                }

                // Order Items
                if (!db.objectStoreNames.contains(STORES.ORDER_ITEMS)) {
                    const store = db.createObjectStore(STORES.ORDER_ITEMS, { keyPath: 'id' })
                    store.createIndex('order_id', 'order_id')
                }

                // Sync Queue
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' })
                    store.createIndex('status', 'status')
                }

                // Cart
                if (!db.objectStoreNames.contains(STORES.CART)) {
                    db.createObjectStore(STORES.CART, { keyPath: 'id' })
                }

                // Settings
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
                }
            }
        })
    }

    async get(store: string, key: string) {
        const db = this.db || await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly')
            const request = tx.objectStore(store).get(key)
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async getAll(store: string) {
        const db = this.db || await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly')
            const request = tx.objectStore(store).getAll()
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async put(store: string, data: any) {
        const db = this.db || await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            const request = tx.objectStore(store).put(data)
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async delete(store: string, key: string) {
        const db = this.db || await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            const request = tx.objectStore(store).delete(key)
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async clear(store: string) {
        const db = this.db || await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            const request = tx.objectStore(store).clear()
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async bulkPut(store: string, items: any[]) {
        const db = this.db || await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            const objectStore = tx.objectStore(store)

            items.forEach(item => objectStore.put(item))

            tx.oncomplete = () => resolve(true)
            tx.onerror = () => reject(tx.error)
        })
    }
}

export const db = new IndexedDBManager()
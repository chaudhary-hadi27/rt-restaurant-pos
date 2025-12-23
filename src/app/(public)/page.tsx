// src/app/(public)/page.tsx - REFACTORED (200 → 120 lines)
'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, Plus } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import CartDrawer from '@/components/cart/CartDrawer'
import { useCart } from '@/lib/store/cart-store'
import { useHydration } from '@/lib/hooks/useHydration'
import { useMenuItems, useDataLoader } from '@/lib/hooks'

export default function MenuPage() {
    const { data: categories } = useDataLoader({ table: 'menu_categories', filter: { is_active: true }, order: { column: 'display_order' } })
    const { data: items, loading } = useMenuItems()
    const { data: tables } = useDataLoader({ table: 'restaurant_tables', select: 'id, table_number, section, status' })
    const { data: waiters } = useDataLoader({ table: 'waiters', select: 'id, name', filter: { is_active: true } })

    const cart = useCart()
    const hydrated = useHydration()
    const [selectedCat, setSelectedCat] = useState('all')
    const [cartOpen, setCartOpen] = useState(false)

    const filtered = useMemo(
        () => items.filter(i => selectedCat === 'all' || i.category_id === selectedCat),
        [items, selectedCat]
    )

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Items', icon: '📋', count: items.length },
        ...categories.map(cat => ({
            id: cat.id,
            label: cat.name,
            icon: cat.icon,
            count: items.filter(i => i.category_id === cat.id).length
        }))
    ], selectedCat, setSelectedCat)

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Categories" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-[var(--fg)] truncate">Menu</h1>
                                <p className="text-sm text-[var(--muted)]">{filtered.length} items</p>
                            </div>
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="hidden xs:inline">Cart</span>
                                {hydrated && cart.itemCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {cart.itemCount()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 py-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filtered.map(item => (
                                <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-600 transition-all group">
                                    {item.image_url && (
                                        <div className="h-40 overflow-hidden">
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg text-[var(--fg)] mb-1 line-clamp-1">{item.name}</h3>
                                        {item.description && <p className="text-sm text-[var(--muted)] mb-2 line-clamp-2">{item.description}</p>}
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-xl font-bold text-blue-600 truncate">PKR {item.price}</span>
                                            <button
                                                onClick={() => cart.addItem(item)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all font-medium text-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} tables={tables} waiters={waiters} />
        </>
    )
}
// src/app/(public)/page.tsx - THEME + RESPONSIVE FIX
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

            {/* ✅ FIX: Theme Variables Applied */}
            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                {/* ✅ FIX: Header with proper theme */}
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)] backdrop-blur-lg bg-opacity-95">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)] truncate">Menu</h1>
                                <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{filtered.length} items available</p>
                            </div>
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium text-sm sm:text-base shadow-lg active:scale-95 transition-all"
                            >
                                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden xs:inline">Cart</span>
                                {hydrated && cart.itemCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                                        {cart.itemCount()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* ✅ FIX: Content with proper spacing */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
                            <div className="text-5xl mb-4">🍽️</div>
                            <p className="text-[var(--fg)] font-medium mb-2">No items found</p>
                            <p className="text-sm text-[var(--muted)]">Try selecting a different category</p>
                        </div>
                    ) : (
                        /* ✅ FIX: Responsive Grid - Better Mobile Layout */
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {filtered.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-600 transition-all group"
                                >
                                    {/* ✅ Image Section */}
                                    {item.image_url && (
                                        <div className="relative h-40 sm:h-48 overflow-hidden">
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            {/* ✅ Overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}

                                    {/* ✅ Content Section - Better Spacing */}
                                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                        {/* Name */}
                                        <h3 className="font-bold text-base sm:text-lg text-[var(--fg)] line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {item.name}
                                        </h3>

                                        {/* Description */}
                                        {item.description && (
                                            <p className="text-xs sm:text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}

                                        {/* ✅ Price + Add Button - Better Mobile Layout */}
                                        <div className="flex items-center justify-between gap-2 pt-2">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-lg sm:text-xl font-bold text-blue-600 block truncate">
                                                    PKR {item.price}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => cart.addItem(item)}
                                                className="flex-shrink-0 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 sm:gap-2 transition-all font-medium text-sm active:scale-95 shadow-md hover:shadow-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Add</span>
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
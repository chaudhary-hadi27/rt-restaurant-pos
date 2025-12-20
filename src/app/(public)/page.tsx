'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useCart } from '@/lib/store/cart-store'
import { useHydration } from '@/lib/hooks/useHydration'
import { ShoppingCart, Plus } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import CartDrawer from '@/components/cart/CartDrawer'

export default function MenuPage() {
    const { data: categories } = useSupabase('menu_categories', { filter: { is_active: true }, order: { column: 'display_order' } })
    const { data: items, loading } = useSupabase('menu_items', { select: 'id, name, description, price, image_url, category_id, is_available', filter: { is_available: true } })
    const { data: tables } = useSupabase('restaurant_tables', { select: 'id, table_number, section, status, current_order_id' })
    const { data: waiters } = useSupabase('waiters', { select: 'id, name, employee_type', filter: { is_active: true } })

    const cart = useCart()
    const hydrated = useHydration()
    const [selectedCat, setSelectedCat] = useState('all')
    const [cartOpen, setCartOpen] = useState(false)

    const filtered = items.filter(i => selectedCat === 'all' || i.category_id === selectedCat)

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Items', icon: '📋', count: items.length },
        ...categories.map(cat => ({ id: cat.id, label: cat.name, icon: cat.icon, count: items.filter(i => i.category_id === cat.id).length }))
    ], selectedCat, setSelectedCat)

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Categories" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                {/* Header - Sticky on mobile */}
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--fg)] truncate">Menu</h1>
                                <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{filtered.length} items</p>
                            </div>
                            <button onClick={() => setCartOpen(true)}
                                    className="relative px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium flex items-center gap-2 flex-shrink-0 text-sm sm:text-base">
                                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden xs:inline">Cart</span>
                                {hydrated && cart.itemCount() > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {cart.itemCount()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Menu Grid - Mobile optimized */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pt-20 lg:pt-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                            {filtered.map(item => (
                                <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-600 transition-all group">
                                    {item.image_url && (
                                        <div className="h-32 sm:h-40 lg:h-48 overflow-hidden">
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                    )}
                                    <div className="p-2.5 sm:p-3 lg:p-4">
                                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-[var(--fg)] mb-1 line-clamp-1">{item.name}</h3>
                                        {item.description && <p className="text-xs sm:text-sm text-[var(--muted)] mb-2 line-clamp-2">{item.description}</p>}
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 truncate">PKR {item.price}</span>
                                            <button onClick={() => cart.addItem(item)}
                                                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 flex items-center gap-1.5 transition-all font-medium text-xs sm:text-sm flex-shrink-0">
                                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">Add</span>
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
'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useCart } from '@/lib/store/cart-store'
import { useHydration } from '@/lib/hooks/useHydration'
import { ShoppingCart, Plus } from 'lucide-react'
import NestedSidebar from '@/components/layout/NestedSidebar'
import CartDrawer from '@/components/cart/CartDrawer'

export default function MenuPage() {
    const { data: categories } = useSupabase('menu_categories', {
        filter: { is_active: true },
        order: { column: 'display_order' }
    })

    const { data: items, loading } = useSupabase('menu_items', {
        select: 'id, name, description, price, image_url, category_id, is_available',
        filter: { is_available: true }
    })

    const { data: tables } = useSupabase('restaurant_tables', {
        select: 'id, table_number, section, status, current_order_id'
    })

    const { data: waiters } = useSupabase('waiters', {
        select: 'id, name, employee_type',
        filter: { is_active: true }
    })

    const cart = useCart()
    const hydrated = useHydration()
    const [selectedCat, setSelectedCat] = useState('all')
    const [cartOpen, setCartOpen] = useState(false)

    const filtered = items.filter(i => selectedCat === 'all' || i.category_id === selectedCat)

    const nestedItems = [
        {
            id: 'all',
            label: 'All Items',
            icon: '📋',
            count: items.length,
            active: selectedCat === 'all',
            onClick: () => setSelectedCat('all')
        },
        ...categories.map(cat => ({
            id: cat.id,
            label: cat.name,
            icon: cat.icon,
            count: items.filter(i => i.category_id === cat.id).length,
            active: selectedCat === cat.id,
            onClick: () => setSelectedCat(cat.id)
        }))
    ]

    return (
        <>
            <NestedSidebar title="Categories" items={nestedItems} />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--fg)]">Menu</h1>
                                <p className="text-sm text-[var(--muted)] mt-1">{filtered.length} items available</p>
                            </div>
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <ShoppingCart className="w-5 h-5 inline mr-2" />
                                Cart
                                {hydrated && cart.itemCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {cart.itemCount()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16 lg:mt-0">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map(item => (
                                <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-600 transition-all group">
                                    {item.image_url && (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg text-[var(--fg)] mb-1">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{item.description}</p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-bold text-blue-600">PKR {item.price}</span>
                                            <button
                                                onClick={() => cart.addItem(item)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium"
                                            >
                                                <Plus className="w-4 h-4" /> Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CartDrawer
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                tables={tables}
                waiters={waiters}
            />
        </>
    )
}
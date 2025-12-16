'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useCart } from '@/lib/hooks/useCart'
import { ShoppingCart, Plus, Minus, X, CheckCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
        select: 'id, table_number, section, status'
    })

    const { data: waiters } = useSupabase('waiters', {
        select: 'id, name, employee_type',
        filter: { is_active: true }
    })

    const cart = useCart()
    const [search, setSearch] = useState('')
    const [selectedCat, setSelectedCat] = useState('all')
    const [cartOpen, setCartOpen] = useState(false)
    const [selectedTable, setSelectedTable] = useState('')
    const [selectedWaiter, setSelectedWaiter] = useState('')
    const [orderNotes, setOrderNotes] = useState('')
    const [placing, setPlacing] = useState(false)
    const supabase = createClient()

    const filtered = items
        .filter(i => selectedCat === 'all' || i.category_id === selectedCat)
        .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

    const placeOrder = async () => {
        if (!selectedTable || !selectedWaiter) {
            alert('Please select table and waiter')
            return
        }
        if (cart.count === 0) {
            alert('Cart is empty')
            return
        }

        setPlacing(true)
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    table_id: selectedTable,
                    waiter_id: selectedWaiter,
                    status: 'pending',
                    subtotal: cart.subtotal,
                    tax: cart.tax,
                    total_amount: cart.total,
                    notes: orderNotes || null
                })
                .select()
                .single()

            if (orderError) throw orderError

            const orderItems = cart.items.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }))

            await supabase.from('order_items').insert(orderItems)

            await supabase
                .from('restaurant_tables')
                .update({
                    status: 'occupied',
                    waiter_id: selectedWaiter,
                    current_order_id: order.id
                })
                .eq('id', selectedTable)

            await supabase.rpc('increment_waiter_stats', {
                p_waiter_id: selectedWaiter,
                p_orders: 1,
                p_revenue: cart.total
            })

            alert('Order placed successfully! ✓')
            cart.clear()
            setSelectedTable('')
            setSelectedWaiter('')
            setOrderNotes('')
            setCartOpen(false)
        } catch (error) {
            console.error('Order failed:', error)
            alert('Failed to place order')
        }
        setPlacing(false)
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <header className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)]">
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
                            {cart.count > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {cart.count}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search & Categories */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search menu items..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCat('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                selectedCat === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] hover:border-blue-600'
                            }`}
                        >
                            All Items
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCat(c.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    selectedCat === c.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] hover:border-blue-600'
                                }`}
                            >
                                {c.icon} {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Items */}
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
                                            onClick={() => cart.add(item)}
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

            {/* Cart Drawer */}
            {cartOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                            <h2 className="text-xl font-bold text-[var(--fg)]">Your Order</h2>
                            <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors">
                                <X className="w-5 h-5 text-[var(--muted)]" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                                <p className="text-sm font-semibold text-[var(--fg)] mb-3">Order Details</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">Table</label>
                                        <select
                                            value={selectedTable}
                                            onChange={e => setSelectedTable(e.target.value)}
                                            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        >
                                            <option value="">Select table</option>
                                            {tables.filter(t => t.status === 'available' || t.status === 'occupied').map(t => (
                                                <option key={t.id} value={t.id}>Table {t.table_number} - {t.section}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">Waiter</label>
                                        <select
                                            value={selectedWaiter}
                                            onChange={e => setSelectedWaiter(e.target.value)}
                                            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        >
                                            <option value="">Select waiter</option>
                                            {waiters.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {cart.items.map(item => (
                                    <div key={item.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium text-[var(--fg)] text-sm">{item.name}</span>
                                            <span className="font-bold text-blue-600 text-sm">PKR {item.price * item.quantity}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => cart.updateQty(item.id, item.quantity - 1)}
                                                className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded hover:border-red-600 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 py-1 font-semibold text-sm text-[var(--fg)]">{item.quantity}</span>
                                            <button
                                                onClick={() => cart.updateQty(item.id, item.quantity + 1)}
                                                className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded hover:border-green-600 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Notes</label>
                                <textarea
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                    placeholder="Special instructions..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>
                        </div>

                        {cart.count > 0 && (
                            <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)]">
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--muted)]">Subtotal</span>
                                        <span className="text-[var(--fg)] font-medium">PKR {cart.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--muted)]">Tax (5%)</span>
                                        <span className="text-[var(--fg)] font-medium">PKR {cart.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                        <span className="text-[var(--fg)]">Total</span>
                                        <span className="text-blue-600">PKR {cart.total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={placeOrder}
                                    disabled={placing || !selectedTable || !selectedWaiter}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {placing ? 'Placing...' : 'Place Order'}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
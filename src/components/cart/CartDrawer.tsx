'use client'

import { useState } from 'react'
import { useCart } from '@/lib/store/cart-store'
import { Plus, Minus, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
    tables: any[]
    waiters: any[]
}

export default function CartDrawer({ isOpen, onClose, tables, waiters }: CartDrawerProps) {
    const cart = useCart()
    const toast = useToast()
    const supabase = createClient()
    const [placing, setPlacing] = useState(false)

    const getTableStatus = (tableId: string) => {
        const table = tables.find(t => t.id === tableId)
        return table?.current_order_id ? { hasOrder: true, orderId: table.current_order_id } : { hasOrder: false, orderId: null }
    }

    const placeOrder = async () => {
        if (!cart.tableId || !cart.waiterId) return toast.add('error', 'Please select table and waiter')
        if (cart.items.length === 0) return toast.add('error', 'Cart is empty')

        setPlacing(true)
        try {
            const table = tables.find(t => t.id === cart.tableId)
            let orderId = table?.current_order_id
            const isNewOrder = !orderId

            if (isNewOrder) {
                const { data: newOrder, error } = await supabase
                    .from('orders')
                    .insert({
                        table_id: cart.tableId,
                        waiter_id: cart.waiterId,
                        status: 'pending',
                        subtotal: cart.subtotal(),
                        tax: cart.tax(),
                        total_amount: cart.total(),
                        notes: cart.notes || null
                    })
                    .select()
                    .single()

                if (error) throw error
                orderId = newOrder.id

                await supabase.from('restaurant_tables').update({
                    status: 'occupied',
                    waiter_id: cart.waiterId,
                    current_order_id: orderId
                }).eq('id', cart.tableId)
            } else {
                const { data: existing } = await supabase
                    .from('orders')
                    .select('subtotal, tax, total_amount')
                    .eq('id', orderId)
                    .single()

                const newSubtotal = existing.subtotal + cart.subtotal()
                const newTax = newSubtotal * 0.05

                await supabase.from('orders').update({
                    subtotal: newSubtotal,
                    tax: newTax,
                    total_amount: newSubtotal + newTax,
                    notes: cart.notes || existing.notes
                }).eq('id', orderId)
            }

            await supabase.from('order_items').insert(
                cart.items.map(item => ({
                    order_id: orderId,
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                }))
            )

            await supabase.rpc('increment_waiter_stats', {
                p_waiter_id: cart.waiterId,
                p_orders: isNewOrder ? 1 : 0,
                p_revenue: cart.total()
            })

            toast.add('success', isNewOrder ? '✅ New order started!' : '✅ Items added to order!')
            cart.clearCart()
            onClose()
        } catch (error) {
            console.error('Order failed:', error)
            toast.add('error', 'Failed to place order')
        }
        setPlacing(false)
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold text-[var(--fg)]">Your Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Order Details */}
                    <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                        <p className="text-sm font-semibold text-[var(--fg)] mb-3">Order Details</p>
                        <div className="space-y-3">
                            {/* Table Select */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Table</label>
                                <select
                                    value={cart.tableId}
                                    onChange={e => cart.setTable(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="" className="bg-[var(--bg)] text-[var(--fg)]">Select table</option>
                                    {tables.filter(t => t.status === 'available' || t.status === 'occupied').map(t => {
                                        const { hasOrder } = getTableStatus(t.id)
                                        return (
                                            <option key={t.id} value={t.id} className="bg-[var(--bg)] text-[var(--fg)]">
                                                Table {t.table_number} - {t.section} {hasOrder ? '🔄' : ''}
                                            </option>
                                        )
                                    })}
                                </select>
                                {cart.tableId && getTableStatus(cart.tableId).hasOrder && (
                                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                        <p className="text-xs text-yellow-600 font-medium">Running bill - items will be added</p>
                                    </div>
                                )}
                            </div>

                            {/* Waiter Select */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Waiter</label>
                                <select
                                    value={cart.waiterId}
                                    onChange={e => cart.setWaiter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="" className="bg-[var(--bg)] text-[var(--fg)]">Select waiter</option>
                                    {waiters.map(w => (
                                        <option key={w.id} value={w.id} className="bg-[var(--bg)] text-[var(--fg)]">{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-2">
                        {cart.items.map(item => (
                            <div key={item.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                <div className="flex justify-between mb-2">
                                    <span className="font-medium text-[var(--fg)] text-sm">{item.name}</span>
                                    <span className="font-bold text-blue-600 text-sm">PKR {item.price * item.quantity}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                        className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded hover:border-red-600 transition-colors text-[var(--fg)]"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 font-semibold text-sm text-[var(--fg)]">{item.quantity}</span>
                                    <button
                                        onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                        className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded hover:border-green-600 transition-colors text-[var(--fg)]"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">Notes</label>
                        <textarea
                            value={cart.notes}
                            onChange={e => cart.setNotes(e.target.value)}
                            placeholder="Special instructions..."
                            rows={2}
                            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                </div>

                {/* Footer - Total & Checkout */}
                {cart.itemCount() > 0 && (
                    <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)]">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Subtotal</span>
                                <span className="text-[var(--fg)] font-medium">PKR {cart.subtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Tax (5%)</span>
                                <span className="text-[var(--fg)] font-medium">PKR {cart.tax().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                <span className="text-[var(--fg)]">Total</span>
                                <span className="text-blue-600">PKR {cart.total().toFixed(2)}</span>
                            </div>
                        </div>
                        <button
                            onClick={placeOrder}
                            disabled={placing || !cart.tableId || !cart.waiterId}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {placing ? 'Placing...' : cart.tableId && getTableStatus(cart.tableId).hasOrder ? 'Add to Running Bill' : 'Place Order'}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
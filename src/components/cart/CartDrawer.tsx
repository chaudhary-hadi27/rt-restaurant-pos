'use client'

import { useState } from 'react'
import { useCart } from '@/lib/store/cart-store'
import { Plus, Minus, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
    tables: Array<{ id: string; table_number: number; section: string; status: string; current_order_id: string | null }>
    waiters: Array<{ id: string; name: string }>
}

export default function CartDrawer({ isOpen, onClose, tables, waiters }: CartDrawerProps) {
    const cart = useCart()
    const toast = useToast()
    const supabase = createClient()
    const [placing, setPlacing] = useState(false)
    const [showReceipt, setShowReceipt] = useState<any>(null)

    const placeOrder = async () => {
        if (!cart.tableId || !cart.waiterId) return toast.add('error', 'Select table and waiter')
        if (cart.items.length === 0) return toast.add('error', 'Cart is empty')

        setPlacing(true)
        try {
            const table = tables.find(t => t.id === cart.tableId)
            const waiter = waiters.find(w => w.id === cart.waiterId)
            let orderId = table?.current_order_id
            const isNew = !orderId

            if (isNew) {
                const { data: order, error } = await supabase.from('orders').insert({
                    table_id: cart.tableId, waiter_id: cart.waiterId, status: 'pending',
                    subtotal: cart.subtotal(), tax: cart.tax(), total_amount: cart.total(), notes: cart.notes || null
                }).select().single()
                if (error) throw error
                orderId = order.id

                await supabase.from('restaurant_tables').update({
                    status: 'occupied', waiter_id: cart.waiterId, current_order_id: orderId
                }).eq('id', cart.tableId)
            } else {
                const { data: existing } = await supabase.from('orders').select('subtotal, tax').eq('id', orderId).single()
                if (existing) {
                    const newSub = existing.subtotal + cart.subtotal()
                    await supabase.from('orders').update({
                        subtotal: newSub, tax: newSub * 0.05, total_amount: newSub * 1.05, notes: cart.notes
                    }).eq('id', orderId)
                }
            }

            await supabase.from('order_items').insert(
                cart.items.map(i => ({
                    order_id: orderId, menu_item_id: i.id, quantity: i.quantity,
                    unit_price: i.price, total_price: i.price * i.quantity
                }))
            )

            await supabase.rpc('increment_waiter_stats', {
                p_waiter_id: cart.waiterId, p_orders: isNew ? 1 : 0, p_revenue: cart.total()
            })

            setShowReceipt({
                id: orderId,
                restaurant_tables: { table_number: table?.table_number || 0 },
                waiters: { name: waiter?.name || 'N/A' },
                order_items: cart.items.map(i => ({
                    menu_items: { name: i.name, price: i.price },
                    quantity: i.quantity, total_price: i.price * i.quantity
                })),
                subtotal: cart.subtotal(), tax: cart.tax(),
                total_amount: cart.total(), created_at: new Date().toISOString()
            })

            toast.add('success', isNew ? '✅ Order placed!' : '✅ Items added!')
            cart.clearCart()
        } catch (error: any) {
            toast.add('error', error.message || 'Failed to place order')
            setPlacing(false)
        }
    }

    if (!isOpen) return null

    const hasRunningOrder = (tid: string) => tables.find(t => t.id === tid)?.current_order_id

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold text-[var(--fg)]">Your Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Selectors */}
                    <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg space-y-3">
                        <p className="text-sm font-semibold text-[var(--fg)]">Order Details</p>

                        <div>
                            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Table *</label>
                            <select value={cart.tableId} onChange={e => cart.setTable(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                                <option value="">Select table</option>
                                {tables.filter(t => t.status === 'available' || t.status === 'occupied').map(t => (
                                    <option key={t.id} value={t.id}>
                                        Table {t.table_number} - {t.section} {hasRunningOrder(t.id) ? '(Running)' : ''}
                                    </option>
                                ))}
                            </select>
                            {cart.tableId && hasRunningOrder(cart.tableId) && (
                                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    <p className="text-xs text-yellow-600 font-medium">Items will be added to existing order</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Waiter *</label>
                            <select value={cart.waiterId} onChange={e => cart.setWaiter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                                <option value="">Select waiter</option>
                                {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Items */}
                    {cart.items.length > 0 ? (
                        <div className="space-y-2">
                            {cart.items.map(item => (
                                <div key={item.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-[var(--fg)] text-sm flex-1">{item.name}</span>
                                        <span className="font-bold text-blue-600 text-sm ml-2">PKR {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                                className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:border-red-600">
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-3 py-1 font-semibold text-sm">{item.quantity}</span>
                                        <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:border-green-600">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => cart.removeItem(item.id)} className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-3">
                                <X className="w-8 h-8 text-[var(--muted)]" />
                            </div>
                            <p className="text-[var(--muted)] font-medium">Cart is empty</p>
                        </div>
                    )}

                    {/* Notes */}
                    {cart.items.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Special Instructions</label>
                            <textarea value={cart.notes} onChange={e => cart.setNotes(e.target.value)} placeholder="Any special requests..."
                                      rows={2} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.items.length > 0 && (
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
                        <button onClick={placeOrder} disabled={placing || !cart.tableId || !cart.waiterId}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {placing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Placing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    {cart.tableId && hasRunningOrder(cart.tableId) ? 'Add to Order' : 'Place Order'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {showReceipt && <ReceiptModal order={showReceipt} onClose={() => { setShowReceipt(null); setPlacing(false); onClose() }} />}
        </>
    )
}
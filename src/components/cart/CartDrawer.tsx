'use client'

import { useState } from 'react'
import { useCart } from '@/lib/store/cart-store'
import { Plus, Minus, X, CheckCircle, AlertCircle, Truck, Home, CreditCard, Banknote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'
import { logger } from '@/lib/utils/logger'

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
    const [orderType, setOrderType] = useState<'dine-in' | 'delivery'>('dine-in')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
    const [deliveryDetails, setDeliveryDetails] = useState({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        delivery_charges: 100
    })

    const placeOrder = async () => {
        // Validation
        if (orderType === 'dine-in') {
            if (!cart.tableId || !cart.waiterId) {
                toast.add('error', '❌ Select table and waiter')
                return
            }
        } else {
            if (!deliveryDetails.customer_name.trim()) {
                toast.add('error', '❌ Enter customer name')
                return
            }
            if (!deliveryDetails.customer_phone.trim() || deliveryDetails.customer_phone.length < 10) {
                toast.add('error', '❌ Enter valid phone number')
                return
            }
            if (!deliveryDetails.delivery_address.trim()) {
                toast.add('error', '❌ Enter delivery address')
                return
            }
            if (!cart.waiterId) {
                toast.add('error', '❌ Select waiter/delivery person')
                return
            }
        }

        if (cart.items.length === 0) {
            toast.add('error', '❌ Cart is empty')
            return
        }

        setPlacing(true)
        try {
            const table = tables.find(t => t.id === cart.tableId)
            const waiter = waiters.find(w => w.id === cart.waiterId)
            let orderId = orderType === 'dine-in' ? table?.current_order_id : null
            const isNew = !orderId

            const subtotal = cart.subtotal()
            const tax = cart.tax()
            const deliveryFee = orderType === 'delivery' ? deliveryDetails.delivery_charges : 0
            const total = subtotal + tax + deliveryFee

            if (isNew) {
                const orderData: any = {
                    waiter_id: cart.waiterId,
                    status: 'pending',
                    subtotal: subtotal,
                    tax: tax,
                    total_amount: total,
                    notes: cart.notes || null,
                    order_type: orderType,
                    payment_method: paymentMethod,
                    receipt_printed: false
                }

                if (orderType === 'dine-in') {
                    orderData.table_id = cart.tableId
                } else {
                    orderData.customer_name = deliveryDetails.customer_name
                    orderData.customer_phone = deliveryDetails.customer_phone
                    orderData.delivery_address = deliveryDetails.delivery_address
                    orderData.delivery_charges = deliveryDetails.delivery_charges
                }

                const { data: order, error } = await supabase
                    .from('orders')
                    .insert(orderData)
                    .select()
                    .single()

                if (error) throw error
                orderId = order.id

                // Update table if dine-in
                if (orderType === 'dine-in' && cart.tableId) {
                    const { error: tableError } = await supabase
                        .from('restaurant_tables')
                        .update({
                            status: 'occupied',
                            waiter_id: cart.waiterId,
                            current_order_id: orderId
                        })
                        .eq('id', cart.tableId)

                    if (tableError) throw tableError
                }
            } else {
                // Add to existing order
                const { data: existing, error: fetchError } = await supabase
                    .from('orders')
                    .select('subtotal, tax')
                    .eq('id', orderId)
                    .single()

                if (fetchError) throw fetchError

                const newSub = (existing.subtotal || 0) + subtotal
                const newTax = newSub * 0.05
                const newTotal = newSub + newTax

                const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                        subtotal: newSub,
                        tax: newTax,
                        total_amount: newTotal,
                        notes: cart.notes
                    })
                    .eq('id', orderId)

                if (updateError) throw updateError
            }

            // Insert order items
            const orderItems = cart.items.map(i => ({
                order_id: orderId,
                menu_item_id: i.id,
                quantity: i.quantity,
                unit_price: i.price,
                total_price: i.price * i.quantity
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            // Update waiter stats
            const { error: statsError } = await supabase.rpc('increment_waiter_stats', {
                p_waiter_id: cart.waiterId,
                p_orders: isNew ? 1 : 0,
                p_revenue: total
            })

            if (statsError) console.warn('Stats update warning:', statsError)

            // Prepare receipt data
            setShowReceipt({
                id: orderId,
                order_type: orderType,
                payment_method: paymentMethod,
                restaurant_tables: orderType === 'dine-in' ? { table_number: table?.table_number || 0 } : null,
                customer_name: orderType === 'delivery' ? deliveryDetails.customer_name : null,
                customer_phone: orderType === 'delivery' ? deliveryDetails.customer_phone : null,
                delivery_address: orderType === 'delivery' ? deliveryDetails.delivery_address : null,
                delivery_charges: orderType === 'delivery' ? deliveryDetails.delivery_charges : 0,
                waiters: { name: waiter?.name || 'N/A' },
                order_items: cart.items.map(i => ({
                    menu_items: { name: i.name, price: i.price },
                    quantity: i.quantity,
                    total_price: i.price * i.quantity
                })),
                subtotal: subtotal,
                tax: tax,
                total_amount: total,
                created_at: new Date().toISOString()
            })

            toast.add('success', isNew ? '✅ Order placed successfully!' : '✅ Items added to order!')
            cart.clearCart()
        } catch (error: any) {
            logger.error('Order placement failed', error)
            toast.add('error', `❌ ${error.message || 'Failed to place order'}`)
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
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95">
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Order Type Selection */}
                    <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg space-y-3">
                        <p className="text-sm font-semibold text-[var(--fg)]">Order Type</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setOrderType('dine-in')}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                    orderType === 'dine-in'
                                        ? 'border-blue-600 bg-blue-600/20'
                                        : 'border-[var(--border)] bg-[var(--bg)]'
                                }`}
                            >
                                <Home className="w-6 h-6" />
                                <span className="text-sm font-medium">Dine-In</span>
                            </button>
                            <button
                                onClick={() => setOrderType('delivery')}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                    orderType === 'delivery'
                                        ? 'border-blue-600 bg-blue-600/20'
                                        : 'border-[var(--border)] bg-[var(--bg)]'
                                }`}
                            >
                                <Truck className="w-6 h-6" />
                                <span className="text-sm font-medium">Delivery</span>
                            </button>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg space-y-3">
                        <p className="text-sm font-semibold text-[var(--fg)]">Payment Method</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                    paymentMethod === 'cash'
                                        ? 'border-green-600 bg-green-600/20'
                                        : 'border-[var(--border)] bg-[var(--bg)]'
                                }`}
                            >
                                <Banknote className="w-6 h-6" />
                                <span className="text-sm font-medium">Cash</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('online')}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                    paymentMethod === 'online'
                                        ? 'border-green-600 bg-green-600/20'
                                        : 'border-[var(--border)] bg-[var(--bg)]'
                                }`}
                            >
                                <CreditCard className="w-6 h-6" />
                                <span className="text-sm font-medium">Online</span>
                            </button>
                        </div>
                    </div>

                    {/* Dine-In Details */}
                    {orderType === 'dine-in' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Table *</label>
                                <select
                                    value={cart.tableId}
                                    onChange={e => cart.setTable(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
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
                                <select
                                    value={cart.waiterId}
                                    onChange={e => cart.setWaiter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="">Select waiter</option>
                                    {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Delivery Details */}
                    {orderType === 'delivery' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    value={deliveryDetails.customer_name}
                                    onChange={e => setDeliveryDetails({ ...deliveryDetails, customer_name: e.target.value })}
                                    placeholder="Enter customer name"
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={deliveryDetails.customer_phone}
                                    onChange={e => setDeliveryDetails({ ...deliveryDetails, customer_phone: e.target.value })}
                                    placeholder="+92 300 1234567"
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Delivery Address *</label>
                                <textarea
                                    value={deliveryDetails.delivery_address}
                                    onChange={e => setDeliveryDetails({ ...deliveryDetails, delivery_address: e.target.value })}
                                    placeholder="Enter complete delivery address"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Delivery Charges</label>
                                <input
                                    type="number"
                                    value={deliveryDetails.delivery_charges}
                                    onChange={e => setDeliveryDetails({ ...deliveryDetails, delivery_charges: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Assign To *</label>
                                <select
                                    value={cart.waiterId}
                                    onChange={e => cart.setWaiter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="">Select delivery person</option>
                                    {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    {cart.items.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-[var(--fg)]">Order Items</p>
                            {cart.items.map(item => (
                                <div key={item.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-[var(--fg)] text-sm flex-1">{item.name}</span>
                                        <span className="font-bold text-blue-600 text-sm ml-2">PKR {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                            className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:border-red-600 active:scale-95"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-3 py-1 font-semibold text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                            className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:border-green-600 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => cart.removeItem(item.id)}
                                            className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium"
                                        >
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
                            <textarea
                                value={cart.notes}
                                onChange={e => cart.setNotes(e.target.value)}
                                placeholder="Any special requests..."
                                rows={2}
                                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                            />
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
                            {orderType === 'delivery' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Delivery Charges</span>
                                    <span className="text-[var(--fg)] font-medium">PKR {deliveryDetails.delivery_charges}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                <span className="text-[var(--fg)]">Total</span>
                                <span className="text-blue-600">
                                    PKR {(cart.total() + (orderType === 'delivery' ? deliveryDetails.delivery_charges : 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={placeOrder}
                            disabled={placing || cart.items.length === 0 || (orderType === 'dine-in' && (!cart.tableId || !cart.waiterId))}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {placing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Placing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    {orderType === 'dine-in'
                                        ? (cart.tableId && hasRunningOrder(cart.tableId) ? 'Add to Order' : 'Place Order')
                                        : 'Confirm Delivery'}
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
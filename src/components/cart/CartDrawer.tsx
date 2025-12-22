'use client'

import { useState } from 'react'
import { useCart } from '@/lib/store/cart-store'
import { useTheme } from '@/lib/store/theme-store'
import { Plus, Minus, X, CheckCircle, Truck, Home, CreditCard, Banknote, Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react'
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
    const { theme, toggleTheme } = useTheme()
    const supabase = createClient()
    const [placing, setPlacing] = useState(false)
    const [showReceipt, setShowReceipt] = useState<any>(null)
    const [orderType, setOrderType] = useState<'dine-in' | 'delivery'>('dine-in')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
    const [showDetails, setShowDetails] = useState(false)
    const [details, setDetails] = useState({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        delivery_charges: 0
    })

    const placeOrder = async () => {
        if (cart.items.length === 0) {
            toast.add('error', '❌ Cart is empty')
            return
        }

        if (orderType === 'dine-in' && (!cart.tableId || !cart.waiterId)) {
            toast.add('error', '❌ Select table and waiter')
            return
        }

        setPlacing(true)
        try {
            const table = tables.find(t => t.id === cart.tableId)
            let orderId = orderType === 'dine-in' ? table?.current_order_id : null
            const isNew = !orderId

            const subtotal = cart.subtotal()
            const tax = cart.tax()
            const deliveryFee = orderType === 'delivery' ? (details.delivery_charges || 0) : 0
            const total = subtotal + tax + deliveryFee

            if (isNew) {
                const orderData: any = {
                    waiter_id: cart.waiterId || null,
                    status: 'pending',
                    subtotal,
                    tax,
                    total_amount: total,
                    notes: cart.notes || null,
                    order_type: orderType,
                    payment_method: paymentMethod,
                    receipt_printed: false
                }

                if (orderType === 'dine-in') {
                    orderData.table_id = cart.tableId || null
                } else {
                    orderData.customer_name = details.customer_name || null
                    orderData.customer_phone = details.customer_phone || null
                    orderData.delivery_address = details.delivery_address || null
                    orderData.delivery_charges = details.delivery_charges || 0
                }

                const { data: order, error } = await supabase.from('orders').insert(orderData).select().single()
                if (error) throw error
                orderId = order.id

                if (orderType === 'dine-in' && cart.tableId) {
                    await supabase
                        .from('restaurant_tables')
                        .update({ status: 'occupied', waiter_id: cart.waiterId, current_order_id: orderId })
                        .eq('id', cart.tableId)
                }
            } else {
                const { data: existing } = await supabase
                    .from('orders')
                    .select('subtotal, tax')
                    .eq('id', orderId)
                    .single()

                if (!existing) throw new Error('Order not found')

                const newSub = (existing.subtotal || 0) + subtotal
                const newTax = newSub * 0.05

                await supabase
                    .from('orders')
                    .update({ subtotal: newSub, tax: newTax, total_amount: newSub + newTax, notes: cart.notes })
                    .eq('id', orderId)
            }

            const orderItems = cart.items.map(i => ({
                order_id: orderId,
                menu_item_id: i.id,
                quantity: i.quantity,
                unit_price: i.price,
                total_price: i.price * i.quantity
            }))

            await supabase.from('order_items').insert(orderItems)

            if (cart.waiterId) {
                await supabase.rpc('increment_waiter_stats', {
                    p_waiter_id: cart.waiterId,
                    p_orders: isNew ? 1 : 0,
                    p_revenue: total
                })
            }

            const waiter = waiters.find(w => w.id === cart.waiterId)
            setShowReceipt({
                id: orderId,
                order_type: orderType,
                payment_method: paymentMethod,
                restaurant_tables: orderType === 'dine-in' ? { table_number: table?.table_number || 0 } : null,
                customer_name: orderType === 'delivery' ? details.customer_name : null,
                customer_phone: orderType === 'delivery' ? details.customer_phone : null,
                delivery_address: orderType === 'delivery' ? details.delivery_address : null,
                delivery_charges: orderType === 'delivery' ? details.delivery_charges : 0,
                waiters: { name: waiter?.name || 'N/A' },
                order_items: cart.items.map(i => ({
                    menu_items: { name: i.name, price: i.price },
                    quantity: i.quantity,
                    total_price: i.price * i.quantity
                })),
                subtotal,
                tax,
                total_amount: total,
                created_at: new Date().toISOString()
            })

            toast.add('success', '✅ Order placed!')
            cart.clearCart()
            setDetails({ customer_name: '', customer_phone: '', delivery_address: '', delivery_charges: 0 })
        } catch (error: any) {
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        } finally {
            setPlacing(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)]">Your Order</h2>
                    <div className="flex gap-2">
                        <button onClick={toggleTheme} className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95">
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95">
                            <X className="w-5 h-5 text-[var(--muted)]" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                    {/* Order Type */}
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { setOrderType('dine-in'); setShowDetails(false) }} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${orderType === 'dine-in' ? 'border-blue-600 bg-blue-600/20' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
                            <Home className="w-6 h-6 text-[var(--fg)]" />
                            <span className="text-sm font-medium text-[var(--fg)]">Dine-In</span>
                        </button>
                        <button onClick={() => setOrderType('delivery')} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${orderType === 'delivery' ? 'border-blue-600 bg-blue-600/20' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
                            <Truck className="w-6 h-6 text-[var(--fg)]" />
                            <span className="text-sm font-medium text-[var(--fg)]">Delivery</span>
                        </button>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setPaymentMethod('cash')} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? 'border-green-600 bg-green-600/20' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
                            <Banknote className="w-6 h-6 text-[var(--fg)]" />
                            <span className="text-sm font-medium text-[var(--fg)]">Cash</span>
                        </button>
                        <button onClick={() => setPaymentMethod('online')} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === 'online' ? 'border-green-600 bg-green-600/20' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
                            <CreditCard className="w-6 h-6 text-[var(--fg)]" />
                            <span className="text-sm font-medium text-[var(--fg)]">Online</span>
                        </button>
                    </div>

                    {/* Dine-In Details */}
                    {orderType === 'dine-in' && (
                        <div className="space-y-3">
                            <select value={cart.tableId} onChange={e => cart.setTable(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm">
                                <option value="">Select table *</option>
                                {tables.filter(t => t.status === 'available' || t.status === 'occupied').map(t => (
                                    <option key={t.id} value={t.id}>Table {t.table_number} - {t.section}</option>
                                ))}
                            </select>
                            <select value={cart.waiterId} onChange={e => cart.setWaiter(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm">
                                <option value="">Select waiter *</option>
                                {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Delivery Details - Optional Toggle */}
                    {orderType === 'delivery' && (
                        <>
                            <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:border-blue-600">
                                <span className="text-sm font-medium text-[var(--fg)]">Delivery Details (Optional)</span>
                                {showDetails ? <ChevronUp className="w-5 h-5 text-[var(--fg)]" /> : <ChevronDown className="w-5 h-5 text-[var(--fg)]" />}
                            </button>

                            {showDetails && (
                                <div className="space-y-3 animate-in slide-in-from-top-2">
                                    <input type="text" value={details.customer_name} onChange={e => setDetails({ ...details, customer_name: e.target.value })} placeholder="Customer name (optional)" className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm" />
                                    <input type="tel" value={details.customer_phone} onChange={e => setDetails({ ...details, customer_phone: e.target.value })} placeholder="Phone number (optional)" className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm" />
                                    <textarea value={details.delivery_address} onChange={e => setDetails({ ...details, delivery_address: e.target.value })} placeholder="Delivery address (optional)" rows={2} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm resize-none" />
                                    <input type="number" value={details.delivery_charges} onChange={e => setDetails({ ...details, delivery_charges: Number(e.target.value) || 0 })} placeholder="Delivery charges (optional)" className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm" />
                                    <select value={cart.waiterId} onChange={e => cart.setWaiter(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm">
                                        <option value="">Assign to (optional)</option>
                                        {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {/* Items */}
                    {cart.items.length > 0 ? (
                        <div className="space-y-2">
                            {cart.items.map(item => (
                                <div key={item.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-[var(--fg)] text-sm">{item.name}</span>
                                        <span className="font-bold text-blue-600 text-sm">PKR {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:border-red-600">
                                            <Minus className="w-4 h-4 text-[var(--fg)]" />
                                        </button>
                                        <span className="px-3 py-1 font-semibold text-sm text-[var(--fg)]">{item.quantity}</span>
                                        <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:border-green-600">
                                            <Plus className="w-4 h-4 text-[var(--fg)]" />
                                        </button>
                                        <button onClick={() => cart.removeItem(item.id)} className="ml-auto text-xs text-red-600 font-medium">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <X className="w-16 h-16 text-[var(--muted)] mx-auto mb-3" />
                            <p className="text-[var(--muted)]">Cart is empty</p>
                        </div>
                    )}

                    {/* Notes */}
                    {cart.items.length > 0 && (
                        <textarea value={cart.notes} onChange={e => cart.setNotes(e.target.value)} placeholder="Special instructions (optional)" rows={2} className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm resize-none" />
                    )}
                </div>

                {/* Footer */}
                {cart.items.length > 0 && (
                    <div className="border-t border-[var(--border)] p-4 bg-[var(--card)]">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Subtotal</span>
                                <span className="text-[var(--fg)] font-medium">PKR {cart.subtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Tax (5%)</span>
                                <span className="text-[var(--fg)] font-medium">PKR {cart.tax().toFixed(2)}</span>
                            </div>
                            {orderType === 'delivery' && details.delivery_charges > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Delivery</span>
                                    <span className="text-[var(--fg)] font-medium">PKR {details.delivery_charges}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                <span className="text-[var(--fg)]">Total</span>
                                <span className="text-blue-600">PKR {(cart.total() + (orderType === 'delivery' ? details.delivery_charges : 0)).toFixed(2)}</span>
                            </div>
                        </div>
                        <button onClick={placeOrder} disabled={placing} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
                            {placing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Placing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Place Order
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {showReceipt && <ReceiptModal order={showReceipt} onClose={() => { setShowReceipt(null); onClose() }} />}
        </>
    )
}
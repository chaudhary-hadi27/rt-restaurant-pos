// src/components/cart/CartDrawer.tsx
'use client'

import { useState } from 'react'
import { useCart } from '@/lib/store/cart-store'
import { useTheme } from '@/lib/store/theme-store'
import { Plus, Minus, X, CheckCircle, Truck, Home, CreditCard, Banknote, Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react'
import { useOrderManagement } from '@/lib/hooks'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
    tables: Array<{ id: string; table_number: number; section: string; status: string }>
    waiters: Array<{ id: string; name: string }>
}

export default function CartDrawer({ isOpen, onClose, tables, waiters }: CartDrawerProps) {
    const cart = useCart()
    const { theme, toggleTheme } = useTheme()
    const { createOrder, loading } = useOrderManagement()
    const [showReceipt, setShowReceipt] = useState<any>(null)
    const [orderType, setOrderType] = useState<'dine-in' | 'delivery'>('dine-in')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
    const [showDetails, setShowDetails] = useState(false)
    const [details, setDetails] = useState({ customer_name: '', customer_phone: '', delivery_address: '', delivery_charges: 0 })

    const placeOrder = async () => {
        if (cart.items.length === 0) return

        // Validation for dine-in
        if (orderType === 'dine-in' && (!cart.tableId || !cart.waiterId)) return

        // Validation for delivery - payment required
        if (orderType === 'delivery' && !paymentMethod) return

        const subtotal = cart.subtotal()
        const tax = cart.tax()
        const deliveryFee = orderType === 'delivery' ? details.delivery_charges : 0
        const total = subtotal + tax + deliveryFee

        const orderData: any = {
            waiter_id: cart.waiterId || null,
            status: 'pending',
            subtotal,
            tax,
            total_amount: total,
            notes: cart.notes || null,
            order_type: orderType,
            // ✅ Payment method only for delivery (dine-in set on completion)
            payment_method: orderType === 'delivery' ? paymentMethod : null,
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

        const result = await createOrder(orderData, cart.items)

        if (result.success && result.order) {
            const waiter = waiters.find(w => w.id === cart.waiterId)
            const table = tables.find(t => t.id === cart.tableId)

            setShowReceipt({
                ...result.order,
                restaurant_tables: orderType === 'dine-in' ? { table_number: table?.table_number || 0 } : null,
                customer_name: orderType === 'delivery' ? details.customer_name : null,
                customer_phone: orderType === 'delivery' ? details.customer_phone : null,
                waiters: { name: waiter?.name || 'N/A' },
                order_items: cart.items.map(i => ({
                    menu_items: { name: i.name, price: i.price },
                    quantity: i.quantity,
                    total_price: i.price * i.quantity
                }))
            })

            cart.clearCart()
            setDetails({ customer_name: '', customer_phone: '', delivery_address: '', delivery_charges: 0 })
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card)]">
                    <h2 className="text-xl font-bold text-[var(--fg)]">Your Order</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-blue-600" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--muted)]" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--card)]">
                    {/* Order Type */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setOrderType('dine-in')
                                setShowDetails(false)
                            }}
                            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                orderType === 'dine-in'
                                    ? 'border-blue-600 bg-blue-600/20'
                                    : 'border-[var(--border)] bg-[var(--bg)]'
                            }`}
                        >
                            <Home className={`w-6 h-6 ${orderType === 'dine-in' ? 'text-blue-600' : 'text-[var(--fg)]'}`} />
                            <span className={`text-sm font-medium ${orderType === 'dine-in' ? 'text-blue-600' : 'text-[var(--fg)]'}`}>
                                Dine-In
                            </span>
                        </button>
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                orderType === 'delivery'
                                    ? 'border-blue-600 bg-blue-600/20'
                                    : 'border-[var(--border)] bg-[var(--bg)]'
                            }`}
                        >
                            <Truck className={`w-6 h-6 ${orderType === 'delivery' ? 'text-blue-600' : 'text-[var(--fg)]'}`} />
                            <span className={`text-sm font-medium ${orderType === 'delivery' ? 'text-blue-600' : 'text-[var(--fg)]'}`}>
                                Delivery
                            </span>
                        </button>
                    </div>

                    {/* Payment Method - Only for Delivery */}
                    {orderType === 'delivery' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--fg)]">
                                Payment Method <span className="text-red-600">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                        paymentMethod === 'cash'
                                            ? 'border-green-600 bg-green-600/20'
                                            : 'border-[var(--border)] bg-[var(--bg)]'
                                    }`}
                                >
                                    <Banknote className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-green-600' : 'text-[var(--fg)]'}`} />
                                    <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-green-600' : 'text-[var(--fg)]'}`}>
                                        Cash
                                    </span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('online')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                        paymentMethod === 'online'
                                            ? 'border-green-600 bg-green-600/20'
                                            : 'border-[var(--border)] bg-[var(--bg)]'
                                    }`}
                                >
                                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-green-600' : 'text-[var(--fg)]'}`} />
                                    <span className={`text-sm font-medium ${paymentMethod === 'online' ? 'text-green-600' : 'text-[var(--fg)]'}`}>
                                        Online
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dine-In Fields */}
                    {orderType === 'dine-in' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                                    Select Table <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={cart.tableId}
                                    onChange={e => cart.setTable(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    style={{
                                        colorScheme: theme === 'dark' ? 'dark' : 'light'
                                    }}
                                >
                                    <option value="">Select table</option>
                                    {tables.filter(t => t.status === 'available' || t.status === 'occupied').map(t => (
                                        <option key={t.id} value={t.id}>
                                            Table {t.table_number} - {t.section}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                                    Select Waiter <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={cart.waiterId}
                                    onChange={e => cart.setWaiter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    style={{
                                        colorScheme: theme === 'dark' ? 'dark' : 'light'
                                    }}
                                >
                                    <option value="">Select waiter</option>
                                    {waiters.map(w => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Delivery Details */}
                    {orderType === 'delivery' && (
                        <>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:border-blue-600 transition-colors"
                            >
                                <span className="text-sm font-medium text-[var(--fg)]">
                                    Delivery Details (Optional)
                                </span>
                                {showDetails ? (
                                    <ChevronUp className="w-5 h-5 text-[var(--fg)]" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-[var(--fg)]" />
                                )}
                            </button>
                            {showDetails && (
                                <div className="space-y-3 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                                    <input
                                        type="text"
                                        value={details.customer_name}
                                        onChange={e => setDetails({ ...details, customer_name: e.target.value })}
                                        placeholder="Customer name"
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                    <input
                                        type="tel"
                                        value={details.customer_phone}
                                        onChange={e => setDetails({ ...details, customer_phone: e.target.value })}
                                        placeholder="Phone number"
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                    <textarea
                                        value={details.delivery_address}
                                        onChange={e => setDetails({ ...details, delivery_address: e.target.value })}
                                        placeholder="Delivery address"
                                        rows={2}
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                                    />
                                    <input
                                        type="number"
                                        value={details.delivery_charges}
                                        onChange={e => setDetails({ ...details, delivery_charges: Number(e.target.value) || 0 })}
                                        placeholder="Delivery charges (PKR)"
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Cart Items */}
                    {cart.items.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-[var(--fg)] px-1">Order Items</h3>
                            {cart.items.map(item => (
                                <div key={item.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-sm text-[var(--fg)]">{item.name}</span>
                                        <span className="font-bold text-blue-600 text-sm">
                                            PKR {(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                            className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:bg-[var(--bg)] transition-colors"
                                        >
                                            <Minus className="w-4 h-4 text-[var(--fg)]" />
                                        </button>
                                        <span className="px-3 py-1 font-semibold text-sm text-[var(--fg)]">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                            className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded hover:bg-[var(--bg)] transition-colors"
                                        >
                                            <Plus className="w-4 h-4 text-[var(--fg)]" />
                                        </button>
                                        <button
                                            onClick={() => cart.removeItem(item.id)}
                                            className="ml-auto text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty Cart Message */}
                    {cart.items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="text-6xl mb-4">🛒</div>
                            <p className="text-[var(--fg)] font-medium mb-1">Your cart is empty</p>
                            <p className="text-[var(--muted)] text-sm">Add items from the menu</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.items.length > 0 && (
                    <div className="border-t border-[var(--border)] p-4 bg-[var(--card)]">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Subtotal</span>
                                <span className="font-medium text-[var(--fg)]">
                                    PKR {cart.subtotal().toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Tax (5%)</span>
                                <span className="font-medium text-[var(--fg)]">
                                    PKR {cart.tax().toFixed(2)}
                                </span>
                            </div>
                            {orderType === 'delivery' && details.delivery_charges > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Delivery</span>
                                    <span className="font-medium text-[var(--fg)]">
                                        PKR {details.delivery_charges}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                <span className="text-[var(--fg)]">Total</span>
                                <span className="text-blue-600">
                                    PKR {(cart.total() + (orderType === 'delivery' ? details.delivery_charges : 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={placeOrder}
                            disabled={loading || (orderType === 'dine-in' && (!cart.tableId || !cart.waiterId))}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <CheckCircle className="w-5 h-5" />
                            )}
                            {loading ? 'Placing...' : 'Place Order'}
                        </button>

                        {orderType === 'dine-in' && (
                            <p className="text-xs text-center text-[var(--muted)] mt-2">
                                💡 Payment method will be selected when completing the order
                            </p>
                        )}
                    </div>
                )}
            </div>

            {showReceipt && <ReceiptModal order={showReceipt} onClose={() => { setShowReceipt(null); onClose() }} />}
        </>
    )
}

"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, Printer, Users, XCircle, Search, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'
import SplitBillModal from '@/components/features/split-bill/SplitBillModal'
import { useToast } from '@/components/ui/Toast'
import ContextActionsBar from '@/components/ui/ContextActionsBar'  // NEW

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [filter, setFilter] = useState('active')
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showReceipt, setShowReceipt] = useState<any>(null)
    const [showSplitBill, setShowSplitBill] = useState<any>(null)
    const [closingOrder, setClosingOrder] = useState<string | null>(null)
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => {
        load()
        const channel = supabase
            .channel('orders_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, load)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const load = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, restaurant_tables(id, table_number), waiters(name), order_items(*, menu_items(name, price))')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Failed to load orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const closeOrder = async (order: any) => {
        if (!confirm('Close this order and free the table?')) return

        setClosingOrder(order.id)
        try {
            await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', order.id)

            if (order.restaurant_tables?.id) {
                await supabase
                    .from('restaurant_tables')
                    .update({
                        status: 'available',
                        current_order_id: null,
                        waiter_id: null
                    })
                    .eq('id', order.restaurant_tables.id)
            }

            toast.add('success', '✅ Order closed & table freed!')
            load()
        } catch (error) {
            console.error('Failed to close order:', error)
            toast.add('error', 'Failed to close order')
        }
        setClosingOrder(null)
    }

    const getFilteredOrders = () => {
        let filtered = orders

        if (filter === 'active') {
            filtered = filtered.filter(o => o.status === 'pending')
        } else if (filter === 'completed') {
            filtered = filtered.filter(o => o.status === 'completed')
        }

        if (search) {
            filtered = filtered.filter(o =>
                o.id.toLowerCase().includes(search.toLowerCase()) ||
                o.restaurant_tables?.table_number.toString().includes(search) ||
                o.waiters?.name.toLowerCase().includes(search.toLowerCase())
            )
        }

        return filtered
    }

    const filtered = getFilteredOrders()

    const stats = {
        active: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', label: 'Pending' },
            completed: { bg: 'bg-green-500/20', text: 'text-green-600', label: 'Completed' },
            cancelled: { bg: 'bg-red-500/20', text: 'text-red-600', label: 'Cancelled' }
        }
        return badges[status as keyof typeof badges] || badges.pending
    }

    // NEW: Context Actions Handler
    const handleContextAction = (actionId: string) => {
        switch (actionId) {
            case 'refresh':
                load()
                toast.add('success', '🔄 Orders refreshed')
                break
            case 'print-receipt':
                if (filtered.length > 0 && filtered[0].status === 'pending') {
                    setShowReceipt(filtered[0])
                } else {
                    toast.add('error', 'No active orders to print')
                }
                break
            case 'split-bill':
                if (filtered.length > 0 && filtered[0].status === 'pending') {
                    setShowSplitBill(filtered[0])
                } else {
                    toast.add('error', 'No active orders to split')
                }
                break
        }
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--fg)]">Orders Management</h1>
                            <p className="text-sm text-[var(--muted)] mt-1">
                                {stats.active} active • {stats.completed} completed today
                            </p>
                        </div>
                        <button
                            onClick={load}
                            className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
                        </button>
                    </div>
                </div>
            </header>

            {/* NEW: Context Actions Bar */}
            <ContextActionsBar onAction={handleContextAction} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setFilter('active')}
                        className={`p-6 rounded-xl cursor-pointer transition-all ${
                            filter === 'active'
                                ? 'bg-yellow-600 text-white shadow-lg scale-105'
                                : 'bg-[var(--card)] border border-[var(--border)] hover:shadow-lg'
                        }`}
                    >
                        <Clock className="w-8 h-8 mb-3" style={{ color: filter === 'active' ? '#fff' : '#f59e0b' }} />
                        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ opacity: 0.8 }}>Active Orders</p>
                        <p className="text-4xl font-bold">{stats.active}</p>
                    </div>

                    <div
                        onClick={() => setFilter('completed')}
                        className={`p-6 rounded-xl cursor-pointer transition-all ${
                            filter === 'completed'
                                ? 'bg-green-600 text-white shadow-lg scale-105'
                                : 'bg-[var(--card)] border border-[var(--border)] hover:shadow-lg'
                        }`}
                    >
                        <CheckCircle className="w-8 h-8 mb-3" style={{ color: filter === 'completed' ? '#fff' : '#10b981' }} />
                        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ opacity: 0.8 }}>Completed</p>
                        <p className="text-4xl font-bold">{stats.completed}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by order ID, table, or waiter..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--fg)' }} />
                        <p className="text-[var(--fg)] font-medium mb-1">No orders found</p>
                        <p className="text-sm text-[var(--muted)]">
                            {filter === 'active' ? 'No active orders right now' : 'No completed orders'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(o => {
                            const statusBadge = getStatusBadge(o.status)

                            return (
                                <div key={o.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                    {/* Order Header */}
                                    <div className="p-5 border-b border-[var(--border)] bg-[var(--bg)]">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-[var(--fg)]">
                                                        Order #{o.id.slice(0, 8).toUpperCase()}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-md text-xs font-bold capitalize ${statusBadge.bg} ${statusBadge.text}`}>
                                                        {statusBadge.label}
                                                    </span>
                                                    {o.status === 'pending' && (
                                                        <span className="px-3 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-600">
                                                            🔄 Running Bill
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium text-[var(--fg)]">Table</span> {o.restaurant_tables?.table_number || 'N/A'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium text-[var(--fg)]">Waiter</span> {o.waiters?.name || 'N/A'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(o.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-[var(--muted)] mb-1">Total Amount</p>
                                                <p className="text-2xl font-bold text-blue-600">PKR {o.total_amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-5">
                                        <h4 className="text-sm font-semibold text-[var(--fg)] mb-3">Items ({o.order_items?.length || 0})</h4>
                                        <div className="space-y-2 mb-4">
                                            {o.order_items?.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                            {item.quantity}×
                                                        </span>
                                                        <span className="font-medium text-[var(--fg)]">{item.menu_items?.name || 'Unknown Item'}</span>
                                                    </div>
                                                    <span className="font-semibold text-[var(--fg)]">PKR {item.total_price.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setShowReceipt(o)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Print Receipt
                                            </button>

                                            <button
                                                onClick={() => setShowSplitBill(o)}
                                                className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] rounded-lg text-sm font-medium hover:bg-[var(--card)] transition-colors flex items-center gap-2"
                                            >
                                                <Users className="w-4 h-4" />
                                                Split Bill
                                            </button>

                                            {o.status === 'pending' && (
                                                <button
                                                    onClick={() => closeOrder(o)}
                                                    disabled={closingOrder === o.id}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    {closingOrder === o.id ? 'Closing...' : 'Complete & Close'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showReceipt && (
                <ReceiptModal order={showReceipt} onClose={() => setShowReceipt(null)} />
            )}
            {showSplitBill && (
                <SplitBillModal order={showSplitBill} onClose={() => setShowSplitBill(null)} />
            )}
        </div>
    )
}
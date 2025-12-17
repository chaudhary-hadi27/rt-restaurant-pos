"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, Printer, Users, Search, RefreshCw, Eye } from 'lucide-react'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'
import SplitBillModal from '@/components/features/split-bill/SplitBillModal'
import { useToast } from '@/components/ui/Toast'
import ContextActionsBar from '@/components/ui/ContextActionsBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [filter, setFilter] = useState('active')
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showReceipt, setShowReceipt] = useState<any>(null)
    const [showSplitBill, setShowSplitBill] = useState<any>(null)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
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

        return () => { supabase.removeChannel(channel) }
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
        if (!confirm('Complete this order and free the table?')) return

        setClosingOrder(order.id)
        try {
            await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)

            if (order.restaurant_tables?.id) {
                await supabase.from('restaurant_tables').update({
                    status: 'available',
                    current_order_id: null,
                    waiter_id: null
                }).eq('id', order.restaurant_tables.id)
            }

            toast.add('success', '✅ Order completed & table freed!')
            setSelectedOrder(null)
            load()
        } catch (error) {
            console.error('Failed to close order:', error)
            toast.add('error', 'Failed to complete order')
        }
        setClosingOrder(null)
    }

    const filtered = orders
        .filter(o => filter === 'all' || (filter === 'active' ? o.status === 'pending' : o.status === 'completed'))
        .filter(o => !search ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.restaurant_tables?.table_number.toString().includes(search) ||
            o.waiters?.name.toLowerCase().includes(search.toLowerCase())
        )

    const stats = {
        all: orders.length,
        active: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length
    }

    const handleContextAction = (actionId: string) => {
        if (actionId === 'refresh') {
            load()
            toast.add('success', '🔄 Orders refreshed')
        } else if (actionId === 'print-receipt' && filtered[0]?.status === 'pending') {
            setShowReceipt(filtered[0])
        } else if (actionId === 'split-bill' && filtered[0]?.status === 'pending') {
            setShowSplitBill(filtered[0])
        } else {
            toast.add('error', 'No active orders available')
        }
    }

    const columns = [
        {
            key: 'order',
            label: 'Order',
            render: (row: any) => (
                <div>
                    <p className="font-medium text-[var(--fg)]">#{row.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--muted)]">{new Date(row.created_at).toLocaleString()}</p>
                </div>
            )
        },
        {
            key: 'table',
            label: 'Table',
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {row.restaurant_tables?.table_number || '?'}
                    </div>
                    <span className="text-sm text-[var(--fg)]">Table {row.restaurant_tables?.table_number || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'waiter',
            label: 'Waiter',
            render: (row: any) => (
                <span className="text-sm text-[var(--fg)]">{row.waiters?.name || 'N/A'}</span>
            )
        },
        {
            key: 'items',
            label: 'Items',
            render: (row: any) => (
                <span className="text-sm text-[var(--fg)]">{row.order_items?.length || 0} items</span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => {
                const statusColors = {
                    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', label: '🔄 Active' },
                    completed: { bg: 'bg-green-500/20', text: 'text-green-600', label: '✅ Completed' },
                    cancelled: { bg: 'bg-red-500/20', text: 'text-red-600', label: '❌ Cancelled' }
                }
                const status = statusColors[row.status as keyof typeof statusColors] || statusColors.pending
                return (
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}>
                        {status.label}
                    </span>
                )
            }
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right' as const,
            render: (row: any) => (
                <div>
                    <p className="text-lg font-bold text-blue-600">PKR {row.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-[var(--muted)]">Tax: PKR {row.tax.toFixed(2)}</p>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (row: any) => (
                <button
                    onClick={() => setSelectedOrder(row)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                    <Eye className="w-4 h-4" />
                    View
                </button>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <PageHeader
                title="Orders Management"
                subtitle={`${stats.active} active • ${stats.completed} completed today`}
                action={
                    <button onClick={load} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title="Refresh">
                        <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                }
            />

            <ContextActionsBar onAction={handleContextAction} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { key: 'active', label: 'Active', value: stats.active, icon: Clock },
                        { key: 'completed', label: 'Completed', value: stats.completed, icon: CheckCircle },
                        { key: 'all', label: 'Total', value: stats.all, icon: Clock }
                    ].map(stat => (
                        <button
                            key={stat.key}
                            onClick={() => setFilter(stat.key)}
                            className={`p-4 rounded-lg border transition-all text-left ${
                                filter === stat.key
                                    ? 'bg-blue-600/10 border-blue-600'
                                    : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--fg)]'
                            }`}
                        >
                            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">{stat.label}</p>
                            <p className="text-3xl font-bold text-[var(--fg)]">{stat.value}</p>
                        </button>
                    ))}
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

                {/* Orders Table */}
                <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No orders found" />
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-[var(--fg)]">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                                    <span className="text-2xl text-[var(--muted)]">×</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                <span>Table {selectedOrder.restaurant_tables?.table_number}</span>
                                <span>•</span>
                                <span>Waiter: {selectedOrder.waiters?.name}</span>
                                <span>•</span>
                                <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="font-semibold text-[var(--fg)] mb-4">Items ({selectedOrder.order_items?.length})</h4>
                            <div className="space-y-2 mb-6">
                                {selectedOrder.order_items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {item.quantity}×
                                            </span>
                                            <span className="font-medium text-[var(--fg)]">{item.menu_items?.name}</span>
                                        </div>
                                        <span className="font-bold text-[var(--fg)]">PKR {item.total_price}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 p-4 bg-[var(--bg)] rounded-lg mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Subtotal</span>
                                    <span className="text-[var(--fg)] font-medium">PKR {selectedOrder.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Tax (5%)</span>
                                    <span className="text-[var(--fg)] font-medium">PKR {selectedOrder.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                    <span className="text-[var(--fg)]">Total</span>
                                    <span className="text-blue-600">PKR {selectedOrder.total_amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border)] flex gap-3">
                            <button
                                onClick={() => setShowReceipt(selectedOrder)}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print Receipt
                            </button>
                            <button
                                onClick={() => setShowSplitBill(selectedOrder)}
                                className="flex-1 px-4 py-2.5 bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)] rounded-lg hover:bg-[var(--card)] font-medium flex items-center justify-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Split Bill
                            </button>
                            {selectedOrder.status === 'pending' && (
                                <button
                                    onClick={() => closeOrder(selectedOrder)}
                                    disabled={closingOrder === selectedOrder.id}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {closingOrder === selectedOrder.id ? 'Closing...' : 'Complete'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showReceipt && <ReceiptModal order={showReceipt} onClose={() => setShowReceipt(null)} />}
            {showSplitBill && <SplitBillModal order={showSplitBill} onClose={() => setShowSplitBill(null)} />}
        </div>
    )
}
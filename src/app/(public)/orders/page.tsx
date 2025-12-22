"use client"

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Printer, Users, RefreshCw, CheckCircle2, DollarSign } from 'lucide-react'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import UniversalModal from '@/components/ui/UniversalModal'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'
import SplitBillModal from '@/components/features/split-bill/SplitBillModal'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getOrderStatusColor } from '@/lib/utils/statusHelpers'

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [filter, setFilter] = useState('active')
    const [loading, setLoading] = useState(true)
    const [showReceipt, setShowReceipt] = useState<any>(null)
    const [showSplitBill, setShowSplitBill] = useState<any>(null)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [closingOrder, setClosingOrder] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState<string | null>(null)
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
            // ✅ FIXED: Explicit column selection to avoid relationship conflict
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    restaurant_tables!orders_table_id_fkey(id, table_number),
                    waiters(id, name),
                    order_items(*, menu_items(name, price, category_id))
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Failed to load orders:', error)
                throw error
            }

            setOrders(data || [])
        } catch (error: any) {
            console.error('Order load failed:', error)
            toast.add('error', error.message || '❌ Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const closeOrder = async (order: any) => {
        if (!confirm('✅ Complete this order and free the table?')) return
        setClosingOrder(order.id)
        try {
            // Update order status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', order.id)

            if (orderError) throw orderError

            // Free table if dine-in
            if (order.order_type === 'dine-in' && order.table_id) {
                const { error: tableError } = await supabase
                    .from('restaurant_tables')
                    .update({
                        status: 'available',
                        current_order_id: null,
                        waiter_id: null
                    })
                    .eq('id', order.table_id)

                if (tableError) throw tableError
            }

            toast.add('success', '✅ Order completed!')
            setSelectedOrder(null)
            load()
        } catch (error: any) {
            console.error('Complete order failed:', error)
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        } finally {
            setClosingOrder(null)
        }
    }

    const cancelOrder = async (order: any) => {
        if (!confirm('⚠️ Cancel this order? This cannot be undone.')) return
        setCancelling(order.id)
        try {
            // Update order status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', order.id)

            if (orderError) throw orderError

            // Free table if dine-in
            if (order.order_type === 'dine-in' && order.table_id) {
                const { error: tableError } = await supabase
                    .from('restaurant_tables')
                    .update({
                        status: 'available',
                        current_order_id: null,
                        waiter_id: null
                    })
                    .eq('id', order.table_id)

                if (tableError) throw tableError
            }

            toast.add('success', '✅ Order cancelled')
            setSelectedOrder(null)
            load()
        } catch (error: any) {
            console.error('Cancel order failed:', error)
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        } finally {
            setCancelling(null)
        }
    }

    const markAsPrinted = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ receipt_printed: true })
                .eq('id', orderId)

            if (error) throw error
            toast.add('success', '✅ Marked as printed')
            load()
        } catch (error: any) {
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        }
    }

    const getTodayRange = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return { start: today.toISOString(), end: tomorrow.toISOString() }
    }

    const filtered = useMemo(() => {
        let result = orders

        if (filter === 'history') {
            const { start, end } = getTodayRange()
            result = result.filter(o => {
                const orderDate = new Date(o.created_at)
                return orderDate >= new Date(start) && orderDate < new Date(end) && o.status === 'completed'
            })
        } else if (filter === 'active') {
            result = result.filter(o => o.status === 'pending')
        } else if (filter === 'printed') {
            result = result.filter(o => o.receipt_printed === true && o.status === 'pending')
        } else if (filter === 'unpaid') {
            result = result.filter(o => o.receipt_printed === false && o.status === 'pending')
        }

        return result
    }, [orders, filter])

    const stats = useMemo(() => [
        {
            label: 'Active',
            value: orders.filter(o => o.status === 'pending').length,
            color: '#f59e0b',
            onClick: () => setFilter('active'),
            active: filter === 'active'
        },
        {
            label: 'Printed',
            value: orders.filter(o => o.receipt_printed === true && o.status === 'pending').length,
            color: '#3b82f6',
            onClick: () => setFilter('printed'),
            active: filter === 'printed'
        },
        {
            label: 'Unpaid',
            value: orders.filter(o => o.receipt_printed === false && o.status === 'pending').length,
            color: '#ef4444',
            onClick: () => setFilter('unpaid'),
            active: filter === 'unpaid'
        },
        {
            label: "Today Complete",
            value: (() => {
                const { start, end } = getTodayRange()
                return orders.filter(o => {
                    const orderDate = new Date(o.created_at)
                    return orderDate >= new Date(start) && orderDate < new Date(end) && o.status === 'completed'
                }).length
            })(),
            color: '#10b981',
            onClick: () => setFilter('history'),
            active: filter === 'history'
        }
    ], [orders, filter])

    const sidebarItems = useSidebarItems([
        { id: 'active', label: 'Active Orders', icon: '🔄', count: stats[0].value },
        { id: 'printed', label: 'Printed (Paid)', icon: '🖨️', count: stats[1].value },
        { id: 'unpaid', label: 'Unpaid', icon: '⏳', count: stats[2].value },
        { id: 'history', label: 'Today Complete', icon: '✅', count: stats[3].value }
    ], filter, setFilter)

    const columns = [
        {
            key: 'order',
            label: 'Order',
            render: (row: any) => (
                <div>
                    <p className="font-medium text-[var(--fg)] text-sm">
                        #{row.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                        {new Date(row.created_at).toLocaleString()}
                    </p>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            mobileHidden: true,
            render: (row: any) => (
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                    row.order_type === 'dine-in'
                        ? 'bg-blue-500/20 text-blue-600'
                        : 'bg-purple-500/20 text-purple-600'
                }`}>
                    {row.order_type === 'dine-in' ? '🏠 Dine-In' : '🚚 Delivery'}
                </span>
            )
        },
        {
            key: 'table',
            label: 'Table/Customer',
            mobileHidden: true,
            render: (row: any) => (
                <span className="text-sm text-[var(--fg)]">
                    {row.order_type === 'dine-in'
                        ? `Table ${row.restaurant_tables?.table_number || 'N/A'}`
                        : row.customer_name || row.customer_phone || 'N/A'
                    }
                </span>
            )
        },
        {
            key: 'waiter',
            label: 'Waiter',
            mobileHidden: true,
            render: (row: any) => (
                <span className="text-sm text-[var(--fg)]">
                    {row.waiters?.name || 'N/A'}
                </span>
            )
        },
        {
            key: 'payment',
            label: 'Payment',
            render: (row: any) => (
                <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        row.payment_method === 'cash'
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-blue-500/20 text-blue-600'
                    }`}>
                        {row.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}
                    </span>
                    {row.receipt_printed && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Printed
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => {
                const status = getOrderStatusColor(row.status)
                return (
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}>
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
                <p className="text-base sm:text-lg font-bold text-blue-600">
                    PKR {row.total_amount.toLocaleString()}
                </p>
            )
        }
    ]

    const renderMobileCard = (row: any) => (
        <div className="space-y-2">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-[var(--fg)] text-sm">
                        #{row.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                        {row.order_type === 'dine-in'
                            ? `Table ${row.restaurant_tables?.table_number}`
                            : '🚚 Delivery'
                        }
                    </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2 py-1 rounded text-xs ${
                        row.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-green-500/20 text-green-600'
                    }`}>
                        {row.status}
                    </span>
                    <span className={`text-xs ${
                        row.payment_method === 'cash'
                            ? 'text-green-600'
                            : 'text-blue-600'
                    }`}>
                        {row.payment_method === 'cash' ? '💵' : '💳'}
                    </span>
                </div>
            </div>
            <p className="text-lg font-bold text-blue-600">
                PKR {row.total_amount.toLocaleString()}
            </p>
        </div>
    )

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[var(--bg)]">
                <AutoSidebar items={sidebarItems} title="Filters" />

                <div className="lg:ml-64">
                    <PageHeader
                        title="Orders"
                        subtitle={`${stats[0].value} active • ${stats[1].value} printed • ${stats[2].value} unpaid`}
                        action={
                            <button
                                onClick={load}
                                className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
                            </button>
                        }
                    />

                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        <ResponsiveStatsGrid stats={stats} />
                        <UniversalDataTable
                            columns={columns}
                            data={filtered}
                            loading={loading}
                            searchable
                            searchPlaceholder="Search orders..."
                            onRowClick={setSelectedOrder}
                            renderMobileCard={renderMobileCard}
                        />
                    </div>
                </div>

                {/* Order Details Modal */}
                {selectedOrder && (
                    <UniversalModal
                        open={!!selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        title={`Order #${selectedOrder.id.slice(0, 8).toUpperCase()}`}
                        subtitle={
                            selectedOrder.order_type === 'dine-in'
                                ? `Table ${selectedOrder.restaurant_tables?.table_number} • ${selectedOrder.waiters?.name} • ${selectedOrder.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}`
                                : `🚚 Delivery • ${selectedOrder.customer_name || selectedOrder.customer_phone} • ${selectedOrder.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}`
                        }
                        size="lg"
                        footer={
                            <div className="flex flex-wrap gap-2 w-full">
                                <button
                                    onClick={() => {
                                        setShowReceipt(selectedOrder)
                                        markAsPrinted(selectedOrder.id)
                                    }}
                                    className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden sm:inline">Print</span>
                                </button>
                                <button
                                    onClick={() => setShowSplitBill(selectedOrder)}
                                    className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)] rounded-lg hover:bg-[var(--card)] font-medium flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95"
                                >
                                    <Users className="w-4 h-4" />
                                    <span className="hidden sm:inline">Split</span>
                                </button>
                                {selectedOrder.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => cancelOrder(selectedOrder)}
                                            disabled={cancelling === selectedOrder.id}
                                            className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm sm:text-base active:scale-95 disabled:opacity-50"
                                        >
                                            {cancelling === selectedOrder.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                        <button
                                            onClick={() => closeOrder(selectedOrder)}
                                            disabled={closingOrder === selectedOrder.id}
                                            className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base active:scale-95"
                                        >
                                            {closingOrder === selectedOrder.id ? 'Completing...' : 'Complete'}
                                        </button>
                                    </>
                                )}
                            </div>
                        }
                    >
                        <div className="space-y-3 sm:space-y-4">
                            {/* Order Items */}
                            {selectedOrder.order_items?.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between p-2.5 sm:p-3 bg-[var(--bg)] rounded-lg"
                                >
                                    <span className="font-medium text-[var(--fg)] text-sm">
                                        {item.quantity}× {item.menu_items?.name}
                                    </span>
                                    <span className="font-bold text-[var(--fg)] text-sm">
                                        PKR {item.total_price}
                                    </span>
                                </div>
                            ))}

                            {/* Delivery Info */}
                            {selectedOrder.order_type === 'delivery' && (
                                <div className="p-3 sm:p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg space-y-2">
                                    <p className="text-sm font-semibold text-[var(--fg)] flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Delivery Details
                                    </p>
                                    {selectedOrder.customer_name && (
                                        <p className="text-xs text-[var(--muted)]">
                                            Name: {selectedOrder.customer_name}
                                        </p>
                                    )}
                                    <p className="text-xs text-[var(--muted)]">
                                        Phone: {selectedOrder.customer_phone}
                                    </p>
                                    {selectedOrder.delivery_address && (
                                        <p className="text-xs text-[var(--muted)]">
                                            Address: {selectedOrder.delivery_address}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Totals */}
                            <div className="p-3 sm:p-4 bg-[var(--bg)] rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Subtotal</span>
                                    <span className="font-medium">
                                        PKR {selectedOrder.subtotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--muted)]">Tax (5%)</span>
                                    <span className="font-medium">
                                        PKR {selectedOrder.tax.toFixed(2)}
                                    </span>
                                </div>
                                {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_charges > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--muted)]">Delivery</span>
                                        <span className="font-medium">
                                            PKR {selectedOrder.delivery_charges}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-[var(--border)]">
                                    <span>Total</span>
                                    <span className="text-blue-600">
                                        PKR {selectedOrder.total_amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </UniversalModal>
                )}

                {showReceipt && (
                    <ReceiptModal
                        order={showReceipt}
                        onClose={() => setShowReceipt(null)}
                    />
                )}

                {showSplitBill && (
                    <SplitBillModal
                        order={showSplitBill}
                        onClose={() => setShowSplitBill(null)}
                    />
                )}
            </div>
        </ErrorBoundary>
    )
}
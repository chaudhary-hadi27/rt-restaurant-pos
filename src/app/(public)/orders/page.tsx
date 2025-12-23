// src/app/(public)/orders/page.tsx - REFACTORED (500 → 180 lines)
"use client"

import { useState, useMemo } from 'react'
import { Printer, Users, RefreshCw } from 'lucide-react'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import UniversalModal from '@/components/ui/UniversalModal'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'
import SplitBillModal from '@/components/features/split-bill/SplitBillModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useOrders, useOrderManagement, useOrdersSync } from '@/lib/hooks'
import { getOrderStatusColor } from '@/lib/utils/statusHelpers'

export default function OrdersPage() {
    const [filter, setFilter] = useState('active')
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [showReceipt, setShowReceipt] = useState<any>(null)
    const [showSplitBill, setShowSplitBill] = useState<any>(null)

    const { data: orders, loading, refresh } = useOrders()
    const { completeOrder, cancelOrder, markPrinted, loading: actionLoading } = useOrderManagement()

    useOrdersSync(refresh)

    const getTodayRange = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return { start: today.toISOString(), end: new Date().toISOString() }
    }

    const filtered = useMemo(() => {
        const { start, end } = getTodayRange()

        if (filter === 'history') {
            return orders.filter(o => {
                const orderDate = new Date(o.created_at)
                return orderDate >= new Date(start) && orderDate < new Date(end) && o.status === 'completed'
            })
        }
        if (filter === 'active') return orders.filter(o => o.status === 'pending')
        if (filter === 'printed') return orders.filter(o => o.receipt_printed === true && o.status === 'pending')
        if (filter === 'unpaid') return orders.filter(o => o.receipt_printed === false && o.status === 'pending')
        return orders
    }, [orders, filter])

    const stats = useMemo(() => {
        const { start, end } = getTodayRange()
        return [
            { label: 'Active', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b', onClick: () => setFilter('active'), active: filter === 'active' },
            { label: 'Printed', value: orders.filter(o => o.receipt_printed && o.status === 'pending').length, color: '#3b82f6', onClick: () => setFilter('printed'), active: filter === 'printed' },
            { label: 'Unpaid', value: orders.filter(o => !o.receipt_printed && o.status === 'pending').length, color: '#ef4444', onClick: () => setFilter('unpaid'), active: filter === 'unpaid' },
            { label: "Today Complete", value: orders.filter(o => {
                    const orderDate = new Date(o.created_at)
                    return orderDate >= new Date(start) && orderDate < new Date(end) && o.status === 'completed'
                }).length, color: '#10b981', onClick: () => setFilter('history'), active: filter === 'history' }
        ]
    }, [orders, filter])

    const handleComplete = async (order: any) => {
        if (!confirm('✅ Complete this order?')) return
        const result = await completeOrder(order.id, order.table_id, order.order_type)
        if (result.success) {
            setSelectedOrder(null)
            refresh()
        }
    }

    const handleCancel = async (order: any) => {
        if (!confirm('⚠️ Cancel this order?')) return
        const result = await cancelOrder(order.id, order.table_id, order.order_type)
        if (result.success) {
            setSelectedOrder(null)
            refresh()
        }
    }

    const handlePrint = async (order: any) => {
        await markPrinted(order.id)
        setShowReceipt(order)
        refresh()
    }

    const columns = [
        { key: 'order', label: 'Order', render: (row: any) => (
                <div>
                    <p className="font-medium text-[var(--fg)] text-sm">#{row.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--muted)]">{new Date(row.created_at).toLocaleString()}</p>
                </div>
            )},
        { key: 'type', label: 'Type', mobileHidden: true, render: (row: any) => (
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${row.order_type === 'dine-in' ? 'bg-blue-500/20 text-blue-600' : 'bg-purple-500/20 text-purple-600'}`}>
                {row.order_type === 'dine-in' ? '🏠 Dine-In' : '🚚 Delivery'}
            </span>
            )},
        { key: 'table', label: 'Table/Customer', mobileHidden: true, render: (row: any) => (
                <span className="text-sm text-[var(--fg)]">
                {row.order_type === 'dine-in' ? `Table ${row.restaurant_tables?.table_number || 'N/A'}` : row.customer_name || row.customer_phone || 'N/A'}
            </span>
            )},
        { key: 'payment', label: 'Payment', render: (row: any) => (
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${row.payment_method === 'cash' ? 'bg-green-500/20 text-green-600' : 'bg-blue-500/20 text-blue-600'}`}>
                {row.payment_method === 'cash' ? '💵' : '💳'}
            </span>
            )},
        { key: 'status', label: 'Status', render: (row: any) => {
                const status = getOrderStatusColor(row.status)
                return <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
            }},
        { key: 'amount', label: 'Amount', align: 'right' as const, render: (row: any) => (
                <p className="text-base sm:text-lg font-bold text-blue-600">PKR {row.total_amount.toLocaleString()}</p>
            )}
    ]

    const sidebarItems = useSidebarItems([
        { id: 'active', label: 'Active Orders', icon: '🔄', count: stats[0].value },
        { id: 'printed', label: 'Printed (Paid)', icon: '🖨️', count: stats[1].value },
        { id: 'unpaid', label: 'Unpaid', icon: '⏳', count: stats[2].value },
        { id: 'history', label: 'Today Complete', icon: '✅', count: stats[3].value }
    ], filter, setFilter)

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[var(--bg)]">
                <AutoSidebar items={sidebarItems} title="Filters" />
                <div className="lg:ml-64">
                    <PageHeader title="Orders" subtitle={`${stats[0].value} active • ${stats[1].value} printed`}
                                action={<button onClick={refresh} className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95">
                                    <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
                                </button>} />

                    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                        <ResponsiveStatsGrid stats={stats} />
                        <UniversalDataTable columns={columns} data={filtered} loading={loading} searchable onRowClick={setSelectedOrder} />
                    </div>
                </div>

                {selectedOrder && (
                    <UniversalModal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder.id.slice(0, 8)}`}
                                    footer={
                                        <div className="flex flex-wrap gap-2 w-full">
                                            <button onClick={() => handlePrint(selectedOrder)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm">
                                                <Printer className="w-4 h-4" /> Print
                                            </button>
                                            <button onClick={() => setShowSplitBill(selectedOrder)} className="flex-1 px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:bg-[var(--card)] flex items-center justify-center gap-2 text-sm">
                                                <Users className="w-4 h-4" /> Split
                                            </button>
                                            {selectedOrder.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleCancel(selectedOrder)} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                                                        Cancel
                                                    </button>
                                                    <button onClick={() => handleComplete(selectedOrder)} disabled={actionLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                                        Complete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    }>
                        <div className="space-y-3">
                            {selectedOrder.order_items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between p-3 bg-[var(--bg)] rounded-lg">
                                    <span className="font-medium text-sm">{item.quantity}× {item.menu_items?.name}</span>
                                    <span className="font-bold text-sm">PKR {item.total_price}</span>
                                </div>
                            ))}
                        </div>
                    </UniversalModal>
                )}

                {showReceipt && <ReceiptModal order={showReceipt} onClose={() => setShowReceipt(null)} />}
                {showSplitBill && <SplitBillModal order={showSplitBill} onClose={() => setShowSplitBill(null)} />}
            </div>
        </ErrorBoundary>
    )
}
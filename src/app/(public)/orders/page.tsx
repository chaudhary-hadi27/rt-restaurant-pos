"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, Printer, Users, RefreshCw } from 'lucide-react'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import UniversalModal from '@/components/ui/UniversalModal'
import ReceiptModal from '@/components/features/receipt/ReceiptGenerator'
import SplitBillModal from '@/components/features/split-bill/SplitBillModal'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [filter, setFilter] = useState('active')
    const [loading, setLoading] = useState(true)
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
                    status: 'available', current_order_id: null, waiter_id: null
                }).eq('id', order.restaurant_tables.id)
            }
            toast.add('success', '✅ Order completed!')
            setSelectedOrder(null)
            load()
        } catch (error) {
            toast.add('error', 'Failed to complete order')
        }
        setClosingOrder(null)
    }

    const filtered = orders.filter(o => filter === 'all' || (filter === 'active' ? o.status === 'pending' : o.status === 'completed'))

    const stats = [
        { label: 'Active', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b', onClick: () => setFilter('active'), active: filter === 'active' },
        { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10b981', onClick: () => setFilter('completed'), active: filter === 'completed' },
        { label: 'Total', value: orders.length, color: '#3b82f6', onClick: () => setFilter('all'), active: filter === 'all' }
    ]

    const sidebarItems = useSidebarItems([
        { id: 'active', label: 'Active', icon: '🔄', count: stats[0].value },
        { id: 'completed', label: 'Completed', icon: '✅', count: stats[1].value },
        { id: 'all', label: 'All Orders', icon: '📋', count: stats[2].value }
    ], filter, setFilter)

    const columns = [
        {
            key: 'order',
            label: 'Order',
            render: (row: any) => (
                <div>
                    <p className="font-medium text-[var(--fg)] text-sm">#{row.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--muted)]">{new Date(row.created_at).toLocaleString()}</p>
                </div>
            )
        },
        {
            key: 'table',
            label: 'Table',
            mobileHidden: true,
            render: (row: any) => <span className="text-sm text-[var(--fg)]">Table {row.restaurant_tables?.table_number || 'N/A'}</span>
        },
        {
            key: 'waiter',
            label: 'Waiter',
            mobileHidden: true,
            render: (row: any) => <span className="text-sm text-[var(--fg)]">{row.waiters?.name || 'N/A'}</span>
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => {
                const colors = {
                    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', label: '🔄 Active' },
                    completed: { bg: 'bg-green-500/20', text: 'text-green-600', label: '✅ Done' }
                }
                const status = colors[row.status as keyof typeof colors] || colors.pending
                return <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
            }
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right' as const,
            render: (row: any) => <p className="text-base sm:text-lg font-bold text-blue-600">PKR {row.total_amount.toLocaleString()}</p>
        }
    ]

    const renderMobileCard = (row: any) => (
        <div className="space-y-2">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-[var(--fg)] text-sm">#{row.id.slice(0, 8)}</p>
                    <p className="text-xs text-[var(--muted)]">Table {row.restaurant_tables?.table_number}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-green-500/20 text-green-600'}`}>{row.status}</span>
            </div>
            <p className="text-lg font-bold text-blue-600">PKR {row.total_amount.toLocaleString()}</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <AutoSidebar items={sidebarItems} title="Filters" />

            <div className="lg:ml-64">
                <PageHeader
                    title="Orders"
                    subtitle={`${stats[0].value} active • ${stats[1].value} completed`}
                    action={
                        <button onClick={load} className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95">
                            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
                        </button>
                    }
                />

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    <ResponsiveStatsGrid stats={stats} />
                    <UniversalDataTable columns={columns} data={filtered} loading={loading} searchable searchPlaceholder="Search orders..." onRowClick={setSelectedOrder} renderMobileCard={renderMobileCard} />
                </div>
            </div>

            {selectedOrder && (
                <UniversalModal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder.id.slice(0, 8).toUpperCase()}`} subtitle={`Table ${selectedOrder.restaurant_tables?.table_number} • ${selectedOrder.waiters?.name}`} size="lg"
                                footer={
                                    <>
                                        <button onClick={() => setShowReceipt(selectedOrder)} className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95">
                                            <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print</span>
                                        </button>
                                        <button onClick={() => setShowSplitBill(selectedOrder)} className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)] rounded-lg hover:bg-[var(--card)] font-medium flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95">
                                            <Users className="w-4 h-4" /> <span className="hidden sm:inline">Split</span>
                                        </button>
                                        {selectedOrder.status === 'pending' && (
                                            <button onClick={() => closeOrder(selectedOrder)} disabled={closingOrder === selectedOrder.id} className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base active:scale-95">
                                                {closingOrder === selectedOrder.id ? 'Closing...' : 'Complete'}
                                            </button>
                                        )}
                                    </>
                                }>
                    <div className="space-y-3 sm:space-y-4">
                        {selectedOrder.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between p-2.5 sm:p-3 bg-[var(--bg)] rounded-lg">
                                <span className="font-medium text-[var(--fg)] text-sm">{item.quantity}× {item.menu_items?.name}</span>
                                <span className="font-bold text-[var(--fg)] text-sm">PKR {item.total_price}</span>
                            </div>
                        ))}
                        <div className="p-3 sm:p-4 bg-[var(--bg)] rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Subtotal</span>
                                <span className="font-medium">PKR {selectedOrder.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Tax (5%)</span>
                                <span className="font-medium">PKR {selectedOrder.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-[var(--border)]">
                                <span>Total</span>
                                <span className="text-blue-600">PKR {selectedOrder.total_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </UniversalModal>
            )}

            {showReceipt && <ReceiptModal order={showReceipt} onClose={() => setShowReceipt(null)} />}
            {showSplitBill && <SplitBillModal order={showSplitBill} onClose={() => setShowSplitBill(null)} />}
        </div>
    )
}
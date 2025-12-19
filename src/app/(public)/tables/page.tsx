"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import UniversalModal from '@/components/ui/UniversalModal'
import { RefreshCw, ArrowLeftRight, DollarSign } from 'lucide-react'
import ContextActionsBar from '@/components/ui/ContextActionsBar'
import { useToast } from '@/components/ui/Toast'
import type { TableWithRelations } from '@/types'

export default function TablesPage() {
    const [tables, setTables] = useState<TableWithRelations[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [waiters, setWaiters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedTable, setSelectedTable] = useState<TableWithRelations | null>(null)
    const [transferModal, setTransferModal] = useState(false)
    const [transferSource, setTransferSource] = useState<TableWithRelations | null>(null)
    const [transferDest, setTransferDest] = useState<TableWithRelations | null>(null)

    const supabase = createClient()
    const toast = useToast()

    useEffect(() => {
        loadData()

        // Real-time subscription
        const channel = supabase
            .channel('tables_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, loadData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadData)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load tables
            const { data: tablesData } = await supabase
                .from('restaurant_tables')
                .select('*')
                .order('table_number')

            // Load active orders with items
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                    id, total_amount, status, table_id,
                    order_items(
                        id, quantity, total_price,
                        menu_items(name, price)
                    )
                `)
                .in('status', ['pending', 'preparing'])

            // Load active waiters (only those on duty)
            const { data: waitersData } = await supabase
                .from('waiters')
                .select('id, name, profile_pic')
                .eq('is_on_duty', true)

            setTables(tablesData || [])
            setOrders(ordersData || [])
            setWaiters(waitersData || [])
        } catch (error) {
            console.error('Load error:', error)
            toast.add('error', 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // ✅ ENRICH TABLES WITH RELATIONS
    const enrichedTables: TableWithRelations[] = tables.map(t => ({
        ...t,
        waiter: t.waiter_id && t.status !== 'available'
            ? waiters.find(w => w.id === t.waiter_id) || null
            : null,
        order: t.current_order_id
            ? orders.find(o => o.id === t.current_order_id) || null
            : null
    }))

    const filtered = enrichedTables.filter(t =>
        statusFilter === 'all' || t.status === statusFilter
    )

    const getStatusColor = (status: string) => ({
        available: '#10b981',
        occupied: '#ef4444',
        reserved: '#f59e0b',
        cleaning: '#3b82f6'
    }[status] || '#6b7280')

    // Stats
    const stats = [
        { label: 'Total', value: tables.length, color: '#3b82f6', onClick: () => setStatusFilter('all'), active: statusFilter === 'all' },
        { label: 'Available', value: tables.filter(t => t.status === 'available').length, color: '#10b981', onClick: () => setStatusFilter('available'), active: statusFilter === 'available' },
        { label: 'Occupied', value: tables.filter(t => t.status === 'occupied').length, color: '#ef4444', onClick: () => setStatusFilter('occupied'), active: statusFilter === 'occupied' },
        { label: 'Reserved', value: tables.filter(t => t.status === 'reserved').length, color: '#f59e0b', onClick: () => setStatusFilter('reserved'), active: statusFilter === 'reserved' }
    ]

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Tables', icon: '🏠', count: tables.length },
        { id: 'available', label: 'Available', icon: '🟢', count: stats[1].value },
        { id: 'occupied', label: 'Occupied', icon: '🔴', count: stats[2].value },
        { id: 'reserved', label: 'Reserved', icon: '🟡', count: stats[3].value }
    ], statusFilter, setStatusFilter)

    // Columns
    const columns = [
        {
            key: 'table',
            label: 'Table',
            render: (row: TableWithRelations) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                         style={{ backgroundColor: getStatusColor(row.status) }}>
                        {row.table_number}
                    </div>
                    <div>
                        <p className="font-medium text-[var(--fg)]">Table {row.table_number}</p>
                        <p className="text-xs text-[var(--muted)]">{row.capacity} seats • {row.section}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: TableWithRelations) => (
                <div>
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                          style={{ backgroundColor: `${getStatusColor(row.status)}15`, color: getStatusColor(row.status) }}>
                        {row.status}
                    </span>
                    {row.order && <p className="text-xs text-[var(--muted)] mt-1">🔄 Running Bill</p>}
                </div>
            )
        },
        {
            key: 'waiter',
            label: 'Waiter',
            mobileHidden: true,
            render: (row: TableWithRelations) => {
                // ✅ Only show waiter if table is NOT available
                if (row.status === 'available' || !row.waiter) {
                    return <span className="text-sm text-[var(--muted)]">-</span>
                }

                return (
                    <div className="flex items-center gap-2">
                        {row.waiter.profile_pic ? (
                            <img src={row.waiter.profile_pic} alt={row.waiter.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {row.waiter.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm text-[var(--fg)]">{row.waiter.name}</span>
                    </div>
                )
            }
        },
        {
            key: 'amount',
            label: 'Current Bill',
            align: 'right' as const,
            render: (row: TableWithRelations) => {
                if (!row.order) {
                    return <span className="text-sm text-[var(--muted)]">-</span>
                }
                return (
                    <p className="text-lg font-bold text-[var(--fg)]">
                        PKR {row.order.total_amount.toLocaleString()}
                    </p>
                )
            }
        }
    ]

    // Mobile Card
    const renderMobileCard = (row: TableWithRelations) => (
        <div className="space-y-2">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                         style={{ backgroundColor: getStatusColor(row.status) }}>
                        {row.table_number}
                    </div>
                    <div>
                        <p className="font-semibold text-[var(--fg)]">Table {row.table_number}</p>
                        <p className="text-xs text-[var(--muted)]">{row.section}</p>
                    </div>
                </div>
                <span className="px-2 py-1 rounded text-xs font-semibold capitalize"
                      style={{ backgroundColor: `${getStatusColor(row.status)}15`, color: getStatusColor(row.status) }}>
                    {row.status}
                </span>
            </div>
            {row.waiter && row.status !== 'available' && (
                <p className="text-xs text-[var(--muted)]">👤 {row.waiter.name}</p>
            )}
            {row.order && (
                <p className="text-lg font-bold text-[var(--fg)]">PKR {row.order.total_amount.toLocaleString()}</p>
            )}
        </div>
    )

    const handleContextAction = (actionId: string) => {
        if (actionId === 'refresh') {
            loadData()
            toast.add('success', '🔄 Tables refreshed')
        } else if (actionId === 'transfer-table') {
            const occupiedWithOrders = enrichedTables.filter(t => t.status === 'occupied' && t.order)
            if (occupiedWithOrders.length === 0) {
                return toast.add('error', 'No occupied tables with orders')
            }
            setTransferModal(true)
        }
    }

    const executeTransfer = async () => {
        if (!transferSource || !transferDest || !transferSource.current_order_id) {
            return toast.add('error', 'Select both tables')
        }

        try {
            await Promise.all([
                supabase.from('orders').update({ table_id: transferDest.id }).eq('id', transferSource.current_order_id),
                supabase.from('restaurant_tables').update({
                    status: 'available',
                    current_order_id: null,
                    waiter_id: null
                }).eq('id', transferSource.id),
                supabase.from('restaurant_tables').update({
                    status: 'occupied',
                    current_order_id: transferSource.current_order_id,
                    waiter_id: transferSource.waiter_id
                }).eq('id', transferDest.id)
            ])

            toast.add('success', `✅ Transferred: Table ${transferSource.table_number} → ${transferDest.table_number}`)
            setTransferModal(false)
            setTransferSource(null)
            setTransferDest(null)
            loadData()
        } catch (error: any) {
            toast.add('error', `Failed: ${error.message}`)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <AutoSidebar items={sidebarItems} title="Filter by Status" />

            <div className="lg:ml-64">
                <PageHeader
                    title="Tables"
                    subtitle="Manage restaurant tables & running bills"
                    action={
                        <button onClick={loadData} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                            <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
                        </button>
                    }
                />

                <ContextActionsBar onAction={handleContextAction} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    <ResponsiveStatsGrid stats={stats} />

                    <UniversalDataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        searchable
                        searchPlaceholder="Search tables..."
                        onRowClick={setSelectedTable}
                        renderMobileCard={renderMobileCard}
                    />
                </div>
            </div>

            {/* Bill Modal */}
            {selectedTable?.order && (
                <UniversalModal
                    open={!!selectedTable}
                    onClose={() => setSelectedTable(null)}
                    title={`Table ${selectedTable.table_number} - Running Bill`}
                    subtitle={`Order #${selectedTable.order.id.slice(0, 8)} • ${selectedTable.waiter?.name || 'N/A'}`}
                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                >
                    <div className="space-y-4">
                        {selectedTable.order.order_items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between p-3 bg-[var(--bg)] rounded-lg">
                                <span className="font-medium">{item.quantity}× {item.menu_items.name}</span>
                                <span className="font-bold">PKR {item.total_price}</span>
                            </div>
                        ))}
                        <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/30">
                            <div className="flex justify-between text-2xl font-bold">
                                <span>Total</span>
                                <span className="text-blue-600">PKR {selectedTable.order.total_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </UniversalModal>
            )}

            {/* Transfer Modal */}
            {transferModal && (
                <UniversalModal
                    open={transferModal}
                    onClose={() => setTransferModal(false)}
                    title="Transfer Table"
                    subtitle="Move order from one table to another"
                    icon={<ArrowLeftRight className="w-6 h-6 text-blue-600" />}
                    size="lg"
                    footer={
                        <>
                            <button onClick={() => setTransferModal(false)} className="flex-1 px-4 py-2.5 bg-[var(--bg)] rounded-lg">
                                Cancel
                            </button>
                            <button
                                onClick={executeTransfer}
                                disabled={!transferSource || !transferDest}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Transfer
                            </button>
                        </>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-3">From (Occupied)</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {enrichedTables.filter(t => t.status === 'occupied' && t.order).map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => setTransferSource(table)}
                                        className={`w-full p-3 rounded-lg border-2 text-left ${
                                            transferSource?.id === table.id ? 'border-red-600 bg-red-600/10' : 'border-[var(--border)]'
                                        }`}
                                    >
                                        <p className="font-medium">Table {table.table_number}</p>
                                        <p className="text-xs text-[var(--muted)]">PKR {table.order?.total_amount}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">To (Available)</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {enrichedTables.filter(t => t.status === 'available').map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => setTransferDest(table)}
                                        className={`w-full p-3 rounded-lg border-2 text-left ${
                                            transferDest?.id === table.id ? 'border-green-600 bg-green-600/10' : 'border-[var(--border)]'
                                        }`}
                                    >
                                        <p className="font-medium">Table {table.table_number}</p>
                                        <p className="text-xs text-[var(--muted)]">{table.section}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </UniversalModal>
            )}
        </div>
    )
}
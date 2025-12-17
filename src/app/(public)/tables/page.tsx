"use client"

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsGrid } from '@/components/ui/StatsGrid'
import { DataTable } from '@/components/ui/DataTable'
import { Search, RefreshCw, Eye, DollarSign, ArrowRight, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ContextActionsBar from '@/components/ui/ContextActionsBar'
import { useToast } from '@/components/ui/Toast'

export default function TablesPage() {
    const { data: tables, loading, refresh } = useSupabase('restaurant_tables', {
        select: 'id, table_number, capacity, section, status, waiter_id, current_order_id',
        order: { column: 'table_number' },
        realtime: true
    })

    const { data: waiters } = useSupabase('waiters', {
        select: 'id, name, profile_pic, employee_type'
    })

    const [orders, setOrders] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedTable, setSelectedTable] = useState<any>(null)
    const [transferModal, setTransferModal] = useState(false)
    const [transferSource, setTransferSource] = useState<any>(null)
    const [transferDest, setTransferDest] = useState<any>(null)
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => {
        loadOrders()
    }, [tables])

    const loadOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('id, total_amount, status, table_id, order_items(quantity, total_price, menu_items(name))')
            .in('status', ['pending', 'preparing'])
        setOrders(data || [])
    }

    const enrichedTables = tables.map(t => ({
        ...t,
        waiter: waiters.find(w => w.id === t.waiter_id),
        order: orders.find(o => o.id === t.current_order_id)
    }))

    const filtered = enrichedTables.filter(t =>
        (t.table_number.toString().includes(search) || t.section?.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === 'all' || t.status === statusFilter)
    )

    const getStatusColor = (status: string) => ({
        available: '#10b981', occupied: '#ef4444', reserved: '#f59e0b', cleaning: '#3b82f6'
    }[status] || '#6b7280')

    const handleContextAction = (actionId: string) => {
        if (actionId === 'refresh') {
            refresh()
            toast.add('success', '🔄 Tables refreshed')
        } else if (actionId === 'transfer-table') {
            if (!enrichedTables.some(t => t.status === 'occupied' && t.order)) {
                return toast.add('error', 'No occupied tables with orders')
            }
            setTransferModal(true)
            setTransferSource(null)
            setTransferDest(null)
        }
    }

    const executeTransfer = async () => {
        if (!transferSource || !transferDest) return toast.add('error', 'Select both tables')
        if (transferSource.id === transferDest.id) return toast.add('error', 'Cannot transfer to same table')
        if (transferDest.status !== 'available') return toast.add('error', 'Destination must be available')

        try {
            await Promise.all([
                supabase.from('orders').update({ table_id: transferDest.id }).eq('id', transferSource.current_order_id),
                supabase.from('restaurant_tables').update({ status: 'available', current_order_id: null }).eq('id', transferSource.id),
                supabase.from('restaurant_tables').update({
                    status: 'occupied',
                    current_order_id: transferSource.current_order_id,
                    waiter_id: transferSource.waiter_id
                }).eq('id', transferDest.id)
            ])

            toast.add('success', `✅ Order transferred: Table ${transferSource.table_number} → ${transferDest.table_number}`)
            setTransferModal(false)
            setTransferSource(null)
            setTransferDest(null)
            refresh()
            loadOrders()
        } catch (error: any) {
            toast.add('error', `Transfer failed: ${error.message}`)
        }
    }

    const TableCard = ({ table, selected, onClick, color }: any) => (
        <button
            onClick={onClick}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selected ? `border-${color}-600 bg-${color}-600/10` : 'border-[var(--border)] hover:border-' + color + '-600/50'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-600 text-white flex items-center justify-center font-bold text-sm`}>
                        {table.table_number}
                    </div>
                    <div>
                        <p className="font-medium text-[var(--fg)]">Table {table.table_number}</p>
                        <p className="text-xs text-[var(--muted)]">{table.section}</p>
                    </div>
                </div>
                {selected && <span className={`text-${color}-600 font-bold`}>✓</span>}
            </div>
            {table.order && (
                <div className="text-xs text-[var(--muted)]">
                    Order #{table.order.id.slice(0, 8)} • PKR {table.order.total_amount}
                </div>
            )}
        </button>
    )

    const columns = [
        {
            key: 'table',
            label: 'Table',
            render: (row: any) => (
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
            render: (row: any) => (
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
            render: (row: any) => !row.waiter ? <span className="text-sm text-[var(--muted)]">-</span> : (
                <div className="flex items-center gap-2">
                    {row.waiter.profile_pic ? (
                        <img src={row.waiter.profile_pic} alt={row.waiter.name} className="w-8 h-8 rounded-full object-cover border border-[var(--border)]" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {row.waiter.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-[var(--fg)]">{row.waiter.name}</p>
                        <p className="text-xs text-[var(--muted)] capitalize">{row.waiter.employee_type}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'bill',
            label: 'Current Bill',
            render: (row: any) => !row.order ? <span className="text-sm text-[var(--muted)]">No order</span> : (
                <div>
                    <p className="text-sm font-medium text-[var(--fg)]">Order #{row.order.id.slice(0, 8)}</p>
                    <p className="text-xs text-[var(--muted)]">{row.order.status}</p>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right' as const,
            render: (row: any) => !row.order ? <span className="text-sm text-[var(--muted)]">-</span> : (
                <div>
                    <p className="text-lg font-bold text-[var(--fg)]">{row.order.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-[var(--muted)]">PKR</p>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (row: any) => row.order && (
                <button onClick={() => setSelectedTable(row)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Bill
                </button>
            )
        }
    ]

    const stats = ['total', 'available', 'occupied', 'reserved'].map(key => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: key === 'total' ? tables.length : tables.filter(t => t.status === key).length,
        onClick: () => setStatusFilter(key === 'total' ? 'all' : key),
        active: statusFilter === (key === 'total' ? 'all' : key)
    }))

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <PageHeader title="Tables" subtitle="Manage restaurant tables & running bills"
                        action={
                            <button onClick={refresh} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title="Refresh">
                                <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
                            </button>
                        }
            />

            <ContextActionsBar onAction={handleContextAction} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <StatsGrid stats={stats} />

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tables..."
                           className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No tables found" />
            </div>

            {/* Transfer Modal */}
            {transferModal && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60" onClick={() => setTransferModal(false)}>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-[var(--fg)]">Transfer Table</h3>
                                <p className="text-sm text-[var(--muted)] mt-1">Move order from one table to another</p>
                            </div>
                            <button onClick={() => setTransferModal(false)} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                                <X className="w-5 h-5 text-[var(--muted)]" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-[var(--fg)] mb-3 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-red-500/20 text-red-600 flex items-center justify-center font-bold">1</span>
                                    Select Source (Occupied)
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {enrichedTables.filter(t => t.status === 'occupied' && t.order).map(table => (
                                        <TableCard key={table.id} table={table} selected={transferSource?.id === table.id}
                                                   onClick={() => setTransferSource(table)} color="red" />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-[var(--fg)] mb-3 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-green-500/20 text-green-600 flex items-center justify-center font-bold">2</span>
                                    Select Destination (Available)
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {enrichedTables.filter(t => t.status === 'available').map(table => (
                                        <TableCard key={table.id} table={table} selected={transferDest?.id === table.id}
                                                   onClick={() => setTransferDest(table)} color="green" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {transferSource && transferDest && (
                            <div className="mx-6 mb-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                                <div className="flex items-center justify-center gap-4 text-[var(--fg)]">
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">
                                            {transferSource.table_number}
                                        </div>
                                        <p className="text-sm font-medium">Table {transferSource.table_number}</p>
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-blue-600" />
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">
                                            {transferDest.table_number}
                                        </div>
                                        <p className="text-sm font-medium">Table {transferDest.table_number}</p>
                                    </div>
                                </div>
                                <p className="text-center text-sm text-[var(--muted)] mt-3">
                                    Order #{transferSource.order.id.slice(0, 8)} • PKR {transferSource.order.total_amount.toLocaleString()}
                                </p>
                            </div>
                        )}

                        <div className="p-6 border-t border-[var(--border)] flex gap-3">
                            <button onClick={() => setTransferModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-[var(--bg)] text-[var(--fg)] rounded-lg hover:bg-[var(--card)] font-medium">
                                Cancel
                            </button>
                            <button onClick={executeTransfer} disabled={!transferSource || !transferDest}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                Transfer Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill Modal */}
            {selectedTable?.order && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60" onClick={() => setSelectedTable(null)}>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-[var(--fg)]">Table {selectedTable.table_number} - Running Bill</h3>
                                <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                                    <span className="text-2xl text-[var(--muted)]">×</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                <span>Order #{selectedTable.order.id.slice(0, 8)}</span>
                                <span>•</span>
                                <span>Waiter: {selectedTable.waiter?.name || 'N/A'}</span>
                                <span>•</span>
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-md font-medium">{selectedTable.order.status}</span>
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="font-semibold text-[var(--fg)] mb-4">Ordered Items</h4>
                            <div className="space-y-2">
                                {selectedTable.order.order_items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {item.quantity}
                                            </span>
                                            <span className="font-medium text-[var(--fg)]">{item.menu_items.name}</span>
                                        </div>
                                        <span className="font-bold text-[var(--fg)]">PKR {item.total_price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border)] bg-[var(--bg)]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                    <span className="text-xl font-bold text-[var(--fg)]">Current Total</span>
                                </div>
                                <span className="text-3xl font-bold text-blue-600">PKR {selectedTable.order.total_amount.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-[var(--muted)] text-center">
                                ℹ️ Customer can add more items. Final bill will be printed from Orders page.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
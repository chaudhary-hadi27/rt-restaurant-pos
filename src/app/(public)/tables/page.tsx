"use client"

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsGrid } from '@/components/ui/StatsGrid'
import { DataTable } from '@/components/ui/DataTable'
import { Search, RefreshCw, Eye, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ContextActionsBar from '@/components/ui/ContextActionsBar'  // NEW
import { useToast } from '@/components/ui/Toast'  // NEW

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
    const supabase = createClient()
    const toast = useToast()  // NEW

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

    const enrichedTables = tables.map(t => {
        const waiter = waiters.find(w => w.id === t.waiter_id)
        const order = orders.find(o => o.id === t.current_order_id)

        return {
            ...t,
            waiter,
            order
        }
    })

    const filtered = enrichedTables.filter(t => {
        const matchSearch = t.table_number.toString().includes(search) ||
            t.section?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || t.status === statusFilter
        return matchSearch && matchStatus
    })

    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied: tables.filter(t => t.status === 'occupied').length,
        reserved: tables.filter(t => t.status === 'reserved').length
    }

    const getStatusColor = (status: string) => {
        const colors = {
            available: '#10b981',
            occupied: '#ef4444',
            reserved: '#f59e0b',
            cleaning: '#3b82f6'
        }
        return colors[status as keyof typeof colors] || '#6b7280'
    }

    // NEW: Context Actions Handler
    const handleContextAction = (actionId: string) => {
        switch (actionId) {
            case 'refresh':
                refresh()
                toast.add('success', '🔄 Tables refreshed')
                break
            case 'transfer-table':
                const occupiedTable = filtered.find(t => t.status === 'occupied')
                if (occupiedTable) {
                    setSelectedTable(occupiedTable)
                    toast.add('success', '📋 Select table to transfer')
                } else {
                    toast.add('error', 'No occupied tables to transfer')
                }
                break
        }
    }

    const columns = [
        {
            key: 'table',
            label: 'Table',
            render: (row: any) => {
                const statusColor = getStatusColor(row.status)
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                            style={{ backgroundColor: statusColor }}
                        >
                            {row.table_number}
                        </div>
                        <div>
                            <p className="font-medium text-[var(--fg)]">Table {row.table_number}</p>
                            <p className="text-xs text-[var(--muted)]">{row.capacity} seats • {row.section}</p>
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => {
                const statusColor = getStatusColor(row.status)
                return (
                    <div>
                        <span
                            className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                            style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                        >
                            {row.status}
                        </span>
                        {row.order && (
                            <p className="text-xs text-[var(--muted)] mt-1">🔄 Running Bill</p>
                        )}
                    </div>
                )
            }
        },
        {
            key: 'waiter',
            label: 'Waiter',
            render: (row: any) => {
                if (!row.waiter) return <span className="text-sm text-[var(--muted)]">-</span>
                return (
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
            }
        },
        {
            key: 'bill',
            label: 'Current Bill',
            render: (row: any) => {
                if (!row.order) return <span className="text-sm text-[var(--muted)]">No order</span>
                return (
                    <div>
                        <p className="text-sm font-medium text-[var(--fg)]">Order #{row.order.id.slice(0, 8)}</p>
                        <p className="text-xs text-[var(--muted)]">{row.order.status}</p>
                    </div>
                )
            }
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right' as const,
            render: (row: any) => {
                if (!row.order) return <span className="text-sm text-[var(--muted)]">-</span>
                return (
                    <div>
                        <p className="text-lg font-bold text-[var(--fg)]">{row.order.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-[var(--muted)]">PKR</p>
                    </div>
                )
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (row: any) => {
                if (!row.order) return null
                return (
                    <button
                        onClick={() => setSelectedTable(row)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        View Bill
                    </button>
                )
            }
        }
    ]

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <PageHeader
                title="Tables"
                subtitle="Manage restaurant tables & running bills"
                action={
                    <button onClick={refresh} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title="Refresh">
                        <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                }
            />

            {/* NEW: Context Actions Bar */}
            <ContextActionsBar onAction={handleContextAction} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <StatsGrid
                    stats={[
                        { label: 'Total', value: stats.total, onClick: () => setStatusFilter('all'), active: statusFilter === 'all' },
                        { label: 'Available', value: stats.available, onClick: () => setStatusFilter('available'), active: statusFilter === 'available' },
                        { label: 'Occupied', value: stats.occupied, onClick: () => setStatusFilter('occupied'), active: statusFilter === 'occupied' },
                        { label: 'Reserved', value: stats.reserved, onClick: () => setStatusFilter('reserved'), active: statusFilter === 'reserved' }
                    ]}
                />

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tables..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={filtered}
                    loading={loading}
                    emptyMessage="No tables found"
                />
            </div>

            {/* Running Bill Details Modal */}
            {selectedTable && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60" onClick={() => setSelectedTable(null)}>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-[var(--fg)]">
                                    Table {selectedTable.table_number} - Running Bill
                                </h3>
                                <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                                    <span className="text-2xl text-[var(--muted)]">×</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                <span>Order #{selectedTable.order.id.slice(0, 8)}</span>
                                <span>•</span>
                                <span>Waiter: {selectedTable.waiter?.name}</span>
                                <span>•</span>
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-md font-medium">
                                    {selectedTable.order.status}
                                </span>
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
                                <span className="text-3xl font-bold text-blue-600">
                                    PKR {selectedTable.order.total_amount.toLocaleString()}
                                </span>
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

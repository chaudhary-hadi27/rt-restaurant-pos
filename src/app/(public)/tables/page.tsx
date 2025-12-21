"use client"

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import UniversalModal from '@/components/ui/UniversalModal'
import { RefreshCw, DollarSign } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import type { TableWithRelations } from '@/types'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function TablesPage() {
    const [tables, setTables] = useState<TableWithRelations[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [waiters, setWaiters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedTable, setSelectedTable] = useState<TableWithRelations | null>(null)
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => {
        loadData()
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
            const [tablesData, ordersData, waitersData] = await Promise.all([
                supabase.from('restaurant_tables').select('*').order('table_number'),
                supabase.from('orders').select('id, total_amount, status, table_id, order_items(id, quantity, total_price, menu_items(name, price))').in('status', ['pending', 'preparing']),
                supabase.from('waiters').select('id, name, profile_pic').eq('is_on_duty', true)
            ])
            setTables(tablesData.data || [])
            setOrders(ordersData.data || [])
            setWaiters(waitersData.data || [])
        } catch (error) {
            toast.add('error', 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const enrichedTables: TableWithRelations[] = tables.map(t => ({
        ...t,
        waiter: t.waiter_id && t.status !== 'available' ? waiters.find(w => w.id === t.waiter_id) || null : null,
        order: t.current_order_id ? orders.find(o => o.id === t.current_order_id) || null : null
    }))

    const filtered = useMemo(
        () => enrichedTables.filter(t => statusFilter === 'all' || t.status === statusFilter),
        [enrichedTables, statusFilter]
    )

    const getStatusColor = (status: string) => ({
        available: '#10b981', occupied: '#ef4444', reserved: '#f59e0b', cleaning: '#3b82f6'
    }[status] || '#6b7280')

    const stats = useMemo(() => [
        { label: 'Total', value: tables.length, color: '#3b82f6', onClick: () => setStatusFilter('all'), active: statusFilter === 'all' },
        { label: 'Available', value: tables.filter(t => t.status === 'available').length, color: '#10b981', onClick: () => setStatusFilter('available'), active: statusFilter === 'available' },
        { label: 'Occupied', value: tables.filter(t => t.status === 'occupied').length, color: '#ef4444', onClick: () => setStatusFilter('occupied'), active: statusFilter === 'occupied' },
        { label: 'Reserved', value: tables.filter(t => t.status === 'reserved').length, color: '#f59e0b', onClick: () => setStatusFilter('reserved'), active: statusFilter === 'reserved' }
    ], [tables, statusFilter])

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Tables', icon: '🏠', count: tables.length },
        { id: 'available', label: 'Available', icon: '🟢', count: stats[1].value },
        { id: 'occupied', label: 'Occupied', icon: '🔴', count: stats[2].value },
        { id: 'reserved', label: 'Reserved', icon: '🟡', count: stats[3].value }
    ], statusFilter, setStatusFilter)

    const columns = [
        {
            key: 'table',
            label: 'Table',
            render: (row: TableWithRelations) => (
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm text-sm sm:text-base" style={{ backgroundColor: getStatusColor(row.status) }}>
                        {row.table_number}
                    </div>
                    <div>
                        <p className="font-medium text-[var(--fg)] text-sm">Table {row.table_number}</p>
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
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold capitalize" style={{ backgroundColor: `${getStatusColor(row.status)}15`, color: getStatusColor(row.status) }}>
                        {row.status}
                    </span>
                    {row.order && <p className="text-xs text-[var(--muted)] mt-1">🔄 Running</p>}
                </div>
            )
        },
        {
            key: 'waiter',
            label: 'Waiter',
            mobileHidden: true,
            render: (row: TableWithRelations) => {
                if (row.status === 'available' || !row.waiter) return <span className="text-sm text-[var(--muted)]">-</span>
                return (
                    <div className="flex items-center gap-2">
                        {row.waiter.profile_pic ? (
                            <img src={row.waiter.profile_pic} alt={row.waiter.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">{row.waiter.name.charAt(0).toUpperCase()}</div>
                        )}
                        <span className="text-sm text-[var(--fg)]">{row.waiter.name}</span>
                    </div>
                )
            }
        },
        {
            key: 'amount',
            label: 'Bill',
            align: 'right' as const,
            render: (row: TableWithRelations) => {
                if (!row.order) return <span className="text-sm text-[var(--muted)]">-</span>
                return <p className="text-base sm:text-lg font-bold text-[var(--fg)]">PKR {row.order.total_amount.toLocaleString()}</p>
            }
        }
    ]

    const renderMobileCard = (row: TableWithRelations) => (
        <div className="space-y-2">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: getStatusColor(row.status) }}>{row.table_number}</div>
                    <div>
                        <p className="font-semibold text-[var(--fg)] text-sm">Table {row.table_number}</p>
                        <p className="text-xs text-[var(--muted)]">{row.section}</p>
                    </div>
                </div>
                <span className="px-2 py-1 rounded text-xs font-semibold capitalize" style={{ backgroundColor: `${getStatusColor(row.status)}15`, color: getStatusColor(row.status) }}>{row.status}</span>
            </div>
            {row.waiter && row.status !== 'available' && <p className="text-xs text-[var(--muted)]">👤 {row.waiter.name}</p>}
            {row.order && <p className="text-base font-bold text-[var(--fg)]">PKR {row.order.total_amount.toLocaleString()}</p>}
        </div>
    )

    return (
        <ErrorBoundary>
        <div className="min-h-screen bg-[var(--bg)]">
            <AutoSidebar items={sidebarItems} title="Status" />

            <div className="lg:ml-64">
                <PageHeader title="Tables" subtitle="Restaurant tables & running bills"
                            action={
                                <button onClick={loadData} className="p-2 hover:bg-[var(--bg)] rounded-lg active:scale-95">
                                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
                                </button>
                            } />

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    <ResponsiveStatsGrid stats={stats} />
                    <UniversalDataTable columns={columns} data={filtered} loading={loading} searchable searchPlaceholder="Search tables..." onRowClick={setSelectedTable} renderMobileCard={renderMobileCard} />
                </div>
            </div>

            {selectedTable?.order && (
                <UniversalModal open={!!selectedTable} onClose={() => setSelectedTable(null)} title={`Table ${selectedTable.table_number} - Running Bill`} subtitle={`Order #${selectedTable.order.id.slice(0, 8)} • ${selectedTable.waiter?.name || 'N/A'}`} icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}>
                    <div className="space-y-3 sm:space-y-4">
                        {selectedTable.order.order_items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between p-2.5 sm:p-3 bg-[var(--bg)] rounded-lg">
                                <span className="font-medium text-sm">{item.quantity}× {item.menu_items.name}</span>
                                <span className="font-bold text-sm">PKR {item.total_price}</span>
                            </div>
                        ))}
                        <div className="p-3 sm:p-4 bg-blue-600/10 rounded-lg border border-blue-600/30">
                            <div className="flex justify-between text-lg sm:text-2xl font-bold">
                                <span>Total</span>
                                <span className="text-blue-600">PKR {selectedTable.order.total_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </UniversalModal>
            )}
        </div>
        </ErrorBoundary>
    )
}
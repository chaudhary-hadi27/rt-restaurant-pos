"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus, TrendingUp } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { useToast } from '@/components/ui/Toast'

export default function WaitersPage() {
    const router = useRouter()
    const { data: waiters, loading } = useSupabase('waiters', {
        order: { column: 'created_at', ascending: false },
        realtime: true
    })

    const [statusFilter, setStatusFilter] = useState('all')
    const toast = useToast()

    const filtered = waiters.filter(w => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'active') return w.is_active
        if (statusFilter === 'on-duty') return w.is_on_duty
        return !w.is_active
    })

    // 🎯 STATS
    const stats = [
        { label: 'Total', value: waiters.length, color: '#3b82f6', onClick: () => setStatusFilter('all'), active: statusFilter === 'all' },
        { label: 'Active', value: waiters.filter(w => w.is_active).length, color: '#10b981', onClick: () => setStatusFilter('active'), active: statusFilter === 'active' },
        { label: 'On Duty', value: waiters.filter(w => w.is_on_duty).length, color: '#f59e0b', onClick: () => setStatusFilter('on-duty'), active: statusFilter === 'on-duty' },
        { label: 'Inactive', value: waiters.filter(w => !w.is_active).length, color: '#ef4444', onClick: () => setStatusFilter('inactive'), active: statusFilter === 'inactive' }
    ]

    // 🎯 SIDEBAR
    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Staff', icon: '👥', count: waiters.length },
        { id: 'active', label: 'Active', icon: '✅', count: stats[1].value },
        { id: 'on-duty', label: 'On Duty', icon: '🟢', count: stats[2].value },
        { id: 'inactive', label: 'Inactive', icon: '⭕', count: stats[3].value }
    ], statusFilter, setStatusFilter)

    // 🎯 COLUMNS
    const columns = [
        {
            key: 'staff',
            label: 'Staff',
            render: (row: any) => (
                <div className="flex items-center gap-3">
                    {row.profile_pic ? (
                        <img src={row.profile_pic} alt={row.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {row.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-[var(--fg)]">{row.name}</p>
                        {row.cnic && <p className="text-xs text-[var(--muted)]">{row.cnic}</p>}
                    </div>
                </div>
            )
        },
        {
            key: 'contact',
            label: 'Contact',
            mobileHidden: true,
            render: (row: any) => (
                <span className="text-sm text-[var(--muted)]">{row.phone}</span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.is_on_duty ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="text-sm text-[var(--fg)]">
                        {row.is_on_duty ? 'On Duty' : 'Off Duty'}
                    </span>
                </div>
            )
        },
        {
            key: 'performance',
            label: 'Performance',
            align: 'right' as const,
            render: (row: any) => (
                <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--fg)]">{row.total_orders || 0} orders</p>
                    <p className="text-xs text-[var(--muted)]">PKR {(row.total_revenue || 0).toLocaleString()}</p>
                </div>
            )
        }
    ]

    // 📱 MOBILE CARD
    const renderMobileCard = (row: any) => (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                {row.profile_pic ? (
                    <img src={row.profile_pic} alt={row.name} className="w-12 h-12 rounded-full" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {row.name.charAt(0)}
                    </div>
                )}
                <div className="flex-1">
                    <p className="font-semibold text-[var(--fg)]">{row.name}</p>
                    <p className="text-xs text-[var(--muted)]">{row.phone}</p>
                </div>
                <span className={`w-3 h-3 rounded-full ${row.is_on_duty ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Orders: {row.total_orders || 0}</span>
                <span className="font-semibold">PKR {(row.total_revenue || 0).toLocaleString()}</span>
            </div>
        </div>
    )

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Staff Filters" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--fg)]">Staff Management</h1>
                                <p className="text-sm text-[var(--muted)] mt-1">{filtered.length} employees</p>
                            </div>
                            <button
                                onClick={() => toast.add('success', 'Add staff feature coming soon!')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Staff
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    <ResponsiveStatsGrid stats={stats} />

                    <UniversalDataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        searchable
                        searchPlaceholder="Search by name or phone..."
                        onRowClick={(row) => router.push(`/admin/waiters/${row.id}`)}
                        renderMobileCard={renderMobileCard}
                    />
                </div>
            </div>
        </>
    )
}
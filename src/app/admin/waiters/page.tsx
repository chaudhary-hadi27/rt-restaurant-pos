// src/app/admin/waiters/page.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus, Search, Edit2, Trash2, Phone, TrendingUp, Clock } from 'lucide-react'
import NestedSidebar from '@/components/layout/NestedSidebar'
import { useToast } from '@/components/ui/Toast'

export default function WaitersPage() {
    const router = useRouter()
    const { data: waiters, loading } = useSupabase('waiters', {
        order: { column: 'created_at', ascending: false },
        realtime: true
    })

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const toast = useToast()

    const filtered = waiters.filter(w => {
        const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.phone?.includes(search)
        if (statusFilter === 'all') return matchSearch
        if (statusFilter === 'active') return matchSearch && w.is_active
        if (statusFilter === 'on-duty') return matchSearch && w.is_on_duty
        return matchSearch
    })

    const stats = {
        total: waiters.length,
        active: waiters.filter(w => w.is_active).length,
        onDuty: waiters.filter(w => w.is_on_duty).length,
        inactive: waiters.filter(w => !w.is_active).length
    }

    // Nested Sidebar Items
    const sidebarItems = [
        {
            id: 'all',
            label: 'All Staff',
            icon: '👥',
            count: stats.total,
            active: statusFilter === 'all',
            onClick: () => setStatusFilter('all')
        },
        {
            id: 'active',
            label: 'Active',
            icon: '✅',
            count: stats.active,
            active: statusFilter === 'active',
            onClick: () => setStatusFilter('active')
        },
        {
            id: 'on-duty',
            label: 'On Duty',
            icon: '🟢',
            count: stats.onDuty,
            active: statusFilter === 'on-duty',
            onClick: () => setStatusFilter('on-duty')
        },
        {
            id: 'inactive',
            label: 'Inactive',
            icon: '⭕',
            count: stats.inactive,
            active: statusFilter === 'inactive',
            onClick: () => setStatusFilter('inactive')
        }
    ]

    return (
        <>
            <NestedSidebar title="Staff Filters" items={sidebarItems} />

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
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Staff', value: stats.total, color: '#3b82f6' },
                            { label: 'Active', value: stats.active, color: '#10b981' },
                            { label: 'On Duty', value: stats.onDuty, color: '#f59e0b' },
                            { label: 'Inactive', value: stats.inactive, color: '#ef4444' }
                        ].map(stat => (
                            <div key={stat.label} className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                                <p className="text-xs text-[var(--muted)] mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Staff Table */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Staff</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Contact</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Performance</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                {filtered.map(waiter => (
                                    <tr
                                        key={waiter.id}
                                        onClick={() => router.push(`/admin/waiters/${waiter.id}`)}
                                        className="hover:bg-[var(--bg)] transition-colors cursor-pointer group"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {waiter.profile_pic ? (
                                                    <img src={waiter.profile_pic} alt={waiter.name} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                                        {waiter.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-[var(--fg)] group-hover:text-blue-600">{waiter.name}</p>
                                                    {waiter.cnic && <p className="text-xs text-[var(--muted)]">{waiter.cnic}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                                <Phone className="w-4 h-4" />
                                                <span>{waiter.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${waiter.is_on_duty ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                <span className="text-sm text-[var(--fg)]">
                                                        {waiter.is_on_duty ? 'On Duty' : 'Off Duty'}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-[var(--fg)]">{waiter.total_orders || 0} orders</p>
                                                <p className="text-xs text-[var(--muted)]">PKR {(waiter.total_revenue || 0).toLocaleString()}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/waiters/${waiter.id}`)}
                                                    className="p-2 hover:bg-blue-600/10 rounded-lg"
                                                    title="View Stats"
                                                >
                                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {filtered.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-[var(--muted)]">No staff found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
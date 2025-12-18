// src/app/admin/history/page.tsx
"use client"

import { useState } from 'react'
import { useHistory } from '@/lib/hooks/useHistory'
import { PageHeader } from '@/components/ui/PageHeader'
import { Clock, Download, Filter, TrendingUp } from 'lucide-react'
import HistoryTimeline from '@/components/history/HistoryTimeline'
import { useToast } from '@/components/ui/Toast'

export default function HistoryPage() {
    const [entity, setEntity] = useState<string>('all')
    const [action, setAction] = useState<string>('all')
    const [dateRange, setDateRange] = useState<string>('all')

    const filters = {
        ...(entity !== 'all' && { entity }),
        ...(action !== 'all' && { action }),
        ...(dateRange === 'today' && {
            dateFrom: new Date().toISOString().split('T')[0]
        }),
        ...(dateRange === 'week' && {
            dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }),
        ...(dateRange === 'month' && {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        })
    }

    const { data, loading, stats, refresh } = useHistory(filters)
    const toast = useToast()

    const exportCSV = () => {
        const csv = [
            ['Date', 'Time', 'Entity', 'Action', 'User', 'Details'],
            ...data.map(log => [
                new Date(log.created_at).toLocaleDateString(),
                new Date(log.created_at).toLocaleTimeString(),
                log.entity_type,
                log.action,
                log.user_name || 'System',
                JSON.stringify(log.changes || {})
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `history-${Date.now()}.csv`
        a.click()
        toast.add('success', '📥 Exported successfully!')
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <PageHeader
                title="Activity History"
                subtitle="Track all changes across your restaurant"
                action={
                    <button
                        onClick={refresh}
                        className="p-2 hover:bg-[var(--card)] rounded-lg"
                    >
                        <Clock className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Events', value: stats.total, color: '#3b82f6' },
                        { label: 'Today', value: stats.today, color: '#10b981' },
                        { label: 'This Week', value: stats.week, color: '#f59e0b' }
                    ].map(stat => (
                        <div key={stat.label} className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                            <p className="text-xs text-[var(--muted)] mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[var(--muted)]" />
                            <span className="text-sm font-medium text-[var(--fg)]">Filters:</span>
                        </div>

                        <select
                            value={entity}
                            onChange={e => setEntity(e.target.value)}
                            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)]"
                        >
                            <option value="all">All Entities</option>
                            <option value="orders">Orders</option>
                            <option value="inventory_items">Inventory</option>
                            <option value="restaurant_tables">Tables</option>
                            <option value="menu_items">Menu</option>
                            <option value="waiters">Staff</option>
                        </select>

                        <select
                            value={action}
                            onChange={e => setAction(e.target.value)}
                            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)]"
                        >
                            <option value="all">All Actions</option>
                            <option value="created">Created</option>
                            <option value="updated">Updated</option>
                            <option value="deleted">Deleted</option>
                            <option value="status_changed">Status Changed</option>
                        </select>

                        <select
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)]"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>

                        <button
                            onClick={exportCSV}
                            className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <HistoryTimeline data={data} />
                    )}
                </div>
            </div>
        </div>
    )
}
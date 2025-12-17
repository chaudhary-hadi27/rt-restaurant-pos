// src/app/admin/inventory/page.tsx
'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus, Package, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import NestedSidebar from '@/components/layout/NestedSidebar'
import { useToast } from '@/components/ui/Toast'

export default function InventoryPage() {
    const { data: items, loading, insert, update, remove } = useSupabase('inventory_items', {
        select: '*, inventory_categories(name, icon)',
        filter: { is_active: true },
        realtime: true
    })

    const { data: categories } = useSupabase('inventory_categories')
    const [search, setSearch] = useState('')
    const [stockFilter, setStockFilter] = useState('all')
    const toast = useToast()

    // Calculate stock status
    const getStockStatus = (item: any) => {
        const percentage = (item.quantity / item.reorder_level) * 100
        if (percentage <= 50) return 'critical'
        if (percentage <= 100) return 'low'
        if (percentage <= 200) return 'medium'
        return 'high'
    }

    // Filter items
    const filtered = items.filter(i => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
        if (stockFilter === 'all') return matchSearch
        return matchSearch && getStockStatus(i) === stockFilter
    })

    // Stats
    const stats = {
        critical: items.filter(i => getStockStatus(i) === 'critical').length,
        low: items.filter(i => getStockStatus(i) === 'low').length,
        medium: items.filter(i => getStockStatus(i) === 'medium').length,
        high: items.filter(i => getStockStatus(i) === 'high').length
    }

    // Nested Sidebar Items
    const sidebarItems = [
        {
            id: 'all',
            label: 'All Items',
            icon: '📦',
            count: items.length,
            active: stockFilter === 'all',
            onClick: () => setStockFilter('all')
        },
        {
            id: 'critical',
            label: 'Critical Stock',
            icon: '🔴',
            count: stats.critical,
            active: stockFilter === 'critical',
            onClick: () => setStockFilter('critical')
        },
        {
            id: 'low',
            label: 'Low Stock',
            icon: '🟡',
            count: stats.low,
            active: stockFilter === 'low',
            onClick: () => setStockFilter('low')
        },
        {
            id: 'medium',
            label: 'Medium Stock',
            icon: '🔵',
            count: stats.medium,
            active: stockFilter === 'medium',
            onClick: () => setStockFilter('medium')
        },
        {
            id: 'high',
            label: 'High Stock',
            icon: '🟢',
            count: stats.high,
            active: stockFilter === 'high',
            onClick: () => setStockFilter('high')
        }
    ]

    return (
        <>
            <NestedSidebar title="Inventory Filters" items={sidebarItems} />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--fg)]">Inventory</h1>
                                <p className="text-sm text-[var(--muted)] mt-1">
                                    {filtered.length} items • Total value: PKR {items.reduce((sum, i) => sum + (i.quantity * i.purchase_price), 0).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => toast.add('success', 'Add inventory feature coming soon!')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Item
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Critical', value: stats.critical, icon: AlertCircle, color: '#ef4444' },
                            { label: 'Low Stock', value: stats.low, icon: TrendingDown, color: '#f59e0b' },
                            { label: 'Medium', value: stats.medium, icon: Package, color: '#3b82f6' },
                            { label: 'High Stock', value: stats.high, icon: TrendingUp, color: '#10b981' }
                        ].map(stat => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                                    <Icon className="w-6 h-6 mb-3" style={{ color: stat.color }} />
                                    <p className="text-xs text-[var(--muted)] mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-[var(--fg)]">{stat.value}</p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search inventory..."
                        className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    {/* Items Table */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--fg)' }} />
                            <p className="text-[var(--fg)] font-medium mb-1">No items found</p>
                            <p className="text-sm text-[var(--muted)]">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Item</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Category</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Stock</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Price</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Value</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                    {filtered.map(item => {
                                        const status = getStockStatus(item)
                                        const colors = {
                                            critical: '#ef4444',
                                            low: '#f59e0b',
                                            medium: '#3b82f6',
                                            high: '#10b981'
                                        }
                                        return (
                                            <tr key={item.id} className="hover:bg-[var(--bg)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-[var(--fg)]">{item.name}</p>
                                                    {item.supplier_name && (
                                                        <p className="text-xs text-[var(--muted)]">{item.supplier_name}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--muted)]">
                                                    {item.inventory_categories?.icon} {item.inventory_categories?.name}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                                                            style={{ backgroundColor: `${colors[status]}20`, color: colors[status] }}
                                                        >
                                                            {item.quantity} {item.unit}
                                                        </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-[var(--fg)]">
                                                    PKR {item.purchase_price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-[var(--fg)]">
                                                    PKR {(item.quantity * item.purchase_price).toLocaleString()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
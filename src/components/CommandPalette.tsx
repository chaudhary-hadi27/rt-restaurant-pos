// src/components/CommandPalette.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    Search, Plus, Package, Users, UtensilsCrossed,
    ShoppingBag, LayoutGrid, Clock, TrendingUp,
    FileSpreadsheet, Shield, Printer, ArrowLeftRight, RefreshCw
} from 'lucide-react'

interface CommandPaletteProps {
    open: boolean
    onClose: () => void
}

const ACTIONS = [
    // Restaurant Actions
    { id: 'new-order', label: 'Start New Order', icon: Plus, href: '/', category: 'restaurant', keywords: ['order', 'new', 'menu', 'food'] },
    { id: 'view-tables', label: 'View All Tables', icon: LayoutGrid, href: '/tables', category: 'restaurant', keywords: ['table', 'dining', 'seating'] },
    { id: 'view-orders', label: 'View Orders', icon: ShoppingBag, href: '/orders', category: 'restaurant', keywords: ['order', 'bill', 'receipt'] },

    // Admin Actions
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield, href: '/admin', category: 'admin', keywords: ['admin', 'dashboard', 'overview'] },
    { id: 'manage-inventory', label: 'Manage Inventory', icon: Package, href: '/admin/inventory', category: 'admin', keywords: ['inventory', 'stock', 'items', 'supplies'] },
    { id: 'manage-menu', label: 'Manage Menu', icon: UtensilsCrossed, href: '/admin/menu', category: 'admin', keywords: ['menu', 'food', 'items', 'dishes'] },
    { id: 'manage-waiters', label: 'Manage Staff', icon: Users, href: '/admin/waiters', category: 'admin', keywords: ['staff', 'waiter', 'employee', 'team'] },
    { id: 'manage-tables-admin', label: 'Manage Tables (Admin)', icon: LayoutGrid, href: '/admin/tables', category: 'admin', keywords: ['table', 'setup', 'configure'] },
    { id: 'view-reports', label: 'Sales Reports', icon: FileSpreadsheet, href: '/admin/reports', category: 'admin', keywords: ['report', 'sales', 'analytics', 'revenue'] },
    { id: 'manage-shifts', label: 'Manage Shifts', icon: Clock, href: '/admin/shifts', category: 'admin', keywords: ['shift', 'schedule', 'clock', 'attendance'] }
]

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    const currentSection = pathname.startsWith('/admin') ? 'admin' : 'restaurant'
    const [activeCategory, setActiveCategory] = useState(currentSection)

    useEffect(() => {
        setActiveCategory(pathname.startsWith('/admin') ? 'admin' : 'restaurant')
    }, [pathname])

    useEffect(() => {
        if (!open) {
            setSearch('')
            setSelectedIndex(0)
            return
        }

        const down = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
            }
            if (e.key === 'Enter' && filtered[selectedIndex]) {
                e.preventDefault()
                handleSelect(filtered[selectedIndex])
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, search, selectedIndex])

    const filtered = ACTIONS
        .filter(a => a.category === activeCategory)
        .filter(a => {
            const searchLower = search.toLowerCase()
            return (
                a.label.toLowerCase().includes(searchLower) ||
                a.keywords.some(k => k.includes(searchLower))
            )
        })

    useEffect(() => {
        setSelectedIndex(0)
    }, [search])

    const handleSelect = (action: typeof ACTIONS[0]) => {
        router.push(action.href)
        onClose()
    }

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />

            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-20 md:pt-32 px-4">
                <div className="w-full max-w-2xl bg-[var(--card)] border-2 border-blue-600/50 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">

                    <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
                        <Search className="w-5 h-5 text-blue-600" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${activeCategory === 'admin' ? 'admin' : 'restaurant'} actions...`}
                            className="flex-1 bg-transparent outline-none text-[var(--fg)] placeholder:text-[var(--muted)] text-lg"
                        />

                        <div className="flex gap-1 bg-[var(--bg)] rounded-lg p-1">
                            <button
                                onClick={() => setActiveCategory('restaurant')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    activeCategory === 'restaurant'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-[var(--muted)] hover:text-[var(--fg)]'
                                }`}
                            >
                                🍽️ Restaurant
                            </button>
                            <button
                                onClick={() => setActiveCategory('admin')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    activeCategory === 'admin'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-[var(--muted)] hover:text-[var(--fg)]'
                                }`}
                            >
                                🛡️ Admin
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-[var(--muted)]" />
                                </div>
                                <p className="text-[var(--fg)] font-medium mb-1">No actions found</p>
                                <p className="text-sm text-[var(--muted)]">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filtered.map((action, idx) => {
                                    const Icon = action.icon
                                    const isSelected = idx === selectedIndex

                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleSelect(action)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : 'hover:bg-[var(--bg)] text-[var(--fg)]'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isSelected
                                                    ? 'bg-white/20'
                                                    : 'bg-[var(--bg)] group-hover:bg-blue-600/10'
                                            }`}>
                                                <Icon className={`w-5 h-5 ${
                                                    isSelected ? 'text-white' : 'text-blue-600'
                                                }`} />
                                            </div>

                                            <div className="flex-1 text-left">
                                                <p className={`font-medium ${isSelected ? 'text-white' : 'text-[var(--fg)]'}`}>
                                                    {action.label}
                                                </p>
                                                <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--muted)]'}`}>
                                                    {action.href}
                                                </p>
                                            </div>

                                            {isSelected && (
                                                <kbd className="px-2 py-1 bg-white/20 text-white text-xs rounded border border-white/30">
                                                    ↵
                                                </kbd>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between text-xs text-[var(--muted)]">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↑</kbd>
                                <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↵</kbd>
                                Select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">ESC</kbd>
                                Close
                            </span>
                        </div>
                        <span>
                            <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">⌘K</kbd>
                            {' '}Quick Actions
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
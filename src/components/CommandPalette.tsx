"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Plus, Package, Users, UtensilsCrossed, ShoppingBag, LayoutGrid, Clock, TrendingUp, FileSpreadsheet, Shield, Printer, ArrowLeftRight, RefreshCw, Settings, LogOut, User, Bell, History, Key, Mail, UserPlus, Lock } from 'lucide-react'

const ACTIONS = [
    // Restaurant
    { id: 'new-order', label: 'Start New Order', icon: Plus, href: '/', category: 'restaurant', keywords: ['order', 'new'] },
    { id: 'view-tables', label: 'View Tables', icon: LayoutGrid, href: '/tables', category: 'restaurant', keywords: ['table'] },
    { id: 'view-orders', label: 'View Orders', icon: ShoppingBag, href: '/orders', category: 'restaurant', keywords: ['order'] },
    { id: 'manage-shifts', label: 'Shifts', icon: Clock, href: '/shifts', category: 'restaurant', keywords: ['shift'] },

    // Admin
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield, href: '/admin', category: 'admin', keywords: ['admin'] },
    { id: 'manage-inventory', label: 'Inventory', icon: Package, href: '/admin/inventory', category: 'admin', keywords: ['inventory', 'stock'] },
    { id: 'manage-menu', label: 'Menu', icon: UtensilsCrossed, href: '/admin/menu', category: 'admin', keywords: ['menu'] },
    { id: 'manage-waiters', label: 'Staff', icon: Users, href: '/admin/waiters', category: 'admin', keywords: ['staff', 'waiter'] },
    { id: 'manage-tables-admin', label: 'Tables', icon: LayoutGrid, href: '/admin/tables', category: 'admin', keywords: ['table'] },
    { id: 'manage-shifts', label: 'Shifts', icon: Clock, href: '/admin/shifts', category: 'admin', keywords: ['shift'] },


    // Quick
    { id: 'manage-users', label: 'Admin Users', icon: UserPlus, href: '/admin/users', category: 'actions', keywords: ['admin', 'users'] },
    { id: 'admin-settings', label: 'Settings', icon: Settings, href: '/admin/settings', category: 'actions', keywords: ['settings'] },
    { id: 'change-password', label: 'Password', icon: Key, href: '/admin/settings/password', category: 'actions', keywords: ['password'] },
]

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
    const router = useRouter()
    const pathname = usePathname()
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [activeCategory, setActiveCategory] = useState(pathname.startsWith('/admin') ? 'admin' : 'restaurant')

    useEffect(() => {
        setActiveCategory(pathname.startsWith('/admin') ? 'admin' : 'restaurant')
    }, [pathname])

    useEffect(() => {
        if (!open) { setSearch(''); setSelectedIndex(0); return }
        const down = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose() }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
            if (e.key === 'Enter' && filtered[selectedIndex]) { e.preventDefault(); handleSelect(filtered[selectedIndex]) }
            if (e.key === 'Tab') { e.preventDefault(); setActiveCategory(cat => cat === 'restaurant' ? 'admin' : cat === 'admin' ? 'actions' : 'restaurant') }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, search, selectedIndex])

    const filtered = ACTIONS.filter(a => {
        if (activeCategory === 'admin') return a.category === 'admin' || a.category === 'actions'
        return a.category === activeCategory
    }).filter(a => {
        const s = search.toLowerCase()
        return a.label.toLowerCase().includes(s) || a.keywords.some(k => k.includes(s))
    })

    useEffect(() => setSelectedIndex(0), [search, activeCategory])

    const handleSelect = (action: typeof ACTIONS[0]) => { router.push(action.href); onClose() }

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />

            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-16 sm:pt-20 md:pt-32 px-3 sm:px-4">
                <div className="w-full max-w-2xl bg-[var(--card)] border-2 border-blue-600/50 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">

                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 border-b border-[var(--border)]">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeCategory === 'actions' ? 'actions' : activeCategory}...`}
                               className="flex-1 bg-transparent outline-none text-[var(--fg)] placeholder:text-[var(--muted)] text-sm sm:text-base lg:text-lg" />

                        <div className="flex gap-1 bg-[var(--bg)] rounded-lg p-0.5 sm:p-1">
                            <button onClick={() => setActiveCategory('restaurant')} className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs font-medium transition-all ${activeCategory === 'restaurant' ? 'bg-blue-600 text-white' : 'text-[var(--muted)]'}`}>🍽️</button>
                            <button onClick={() => setActiveCategory('admin')} className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs font-medium transition-all ${activeCategory === 'admin' ? 'bg-blue-600 text-white' : 'text-[var(--muted)]'}`}>🛡️</button>
                            <button onClick={() => setActiveCategory('actions')} className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs font-medium transition-all ${activeCategory === 'actions' ? 'bg-blue-600 text-white' : 'text-[var(--muted)]'}`}>⚡</button>
                        </div>
                    </div>

                    <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto p-2">
                        {filtered.length === 0 ? (
                            <div className="py-12 sm:py-16 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--muted)]" />
                                </div>
                                <p className="text-[var(--fg)] font-medium mb-1 text-sm sm:text-base">No commands found</p>
                                <p className="text-xs sm:text-sm text-[var(--muted)]">Try different search</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filtered.map((action, idx) => {
                                    const Icon = action.icon
                                    const isSelected = idx === selectedIndex
                                    return (
                                        <button key={action.id} onClick={() => handleSelect(action)} onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all group active:scale-98 ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg)] text-[var(--fg)]'}`}>
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-white/20' : 'bg-[var(--bg)] group-hover:bg-blue-600/10'}`}>
                                                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`font-medium text-sm sm:text-base truncate ${isSelected ? 'text-white' : 'text-[var(--fg)]'}`}>{action.label}</p>
                                                <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--muted)]'} truncate`}>{action.href}</p>
                                            </div>
                                            {isSelected && <kbd className="hidden sm:inline-flex px-2 py-1 bg-white/20 text-white text-xs rounded border border-white/30">↵</kbd>}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between text-xs text-[var(--muted)]">
                        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↑↓</kbd> Nav
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↵</kbd> Go
                            </span>
                            <span className="hidden sm:flex items-center gap-1 whitespace-nowrap">
                                <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">Tab</kbd> Switch
                            </span>
                        </div>
                        <span className="hidden sm:flex items-center gap-1 whitespace-nowrap">
                            <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">⌘K</kbd>
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
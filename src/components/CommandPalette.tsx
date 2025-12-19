// src/components/CommandPalette.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    Search, Plus, Package, Users, UtensilsCrossed,
    ShoppingBag, LayoutGrid, Clock, TrendingUp,
    FileSpreadsheet, Shield, Printer, ArrowLeftRight,
    RefreshCw, Settings, LogOut, User, Bell, History,
    Key, Mail, UserPlus, Lock
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

    // Admin Navigation
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield, href: '/admin', category: 'admin', keywords: ['admin', 'dashboard', 'overview', 'home'] },
    { id: 'manage-inventory', label: 'Manage Inventory', icon: Package, href: '/admin/inventory', category: 'admin', keywords: ['inventory', 'stock', 'items', 'supplies'] },
    { id: 'manage-menu', label: 'Manage Menu', icon: UtensilsCrossed, href: '/admin/menu', category: 'admin', keywords: ['menu', 'food', 'items', 'dishes'] },
    { id: 'manage-waiters', label: 'Manage Staff', icon: Users, href: '/admin/waiters', category: 'admin', keywords: ['staff', 'waiter', 'employee', 'team'] },
    { id: 'manage-tables-admin', label: 'Manage Tables', icon: LayoutGrid, href: '/admin/tables', category: 'admin', keywords: ['table', 'setup', 'configure'] },
    { id: 'view-reports', label: 'Sales Reports', icon: FileSpreadsheet, href: '/admin/reports', category: 'admin', keywords: ['report', 'sales', 'analytics', 'revenue'] },
    { id: 'manage-shifts', label: 'Manage Shifts', icon: Clock, href: '/admin/shifts', category: 'admin', keywords: ['shift', 'schedule', 'clock', 'attendance'] },
    { id: 'view-history', label: 'Activity History', icon: History, href: '/admin/history', category: 'admin', keywords: ['history', 'activity', 'logs', 'audit'] },

    // Admin Management (New)
    { id: 'manage-users', label: 'Admin Users', icon: UserPlus, href: '/admin/users', category: 'admin', keywords: ['admin', 'users', 'permissions', 'roles'] },
    { id: 'admin-settings', label: 'Settings', icon: Settings, href: '/admin/settings', category: 'admin', keywords: ['settings', 'config', 'preferences'] },

    // Quick Actions (New)
    { id: 'change-password', label: 'Change Password', icon: Key, href: '/admin/settings/password', category: 'actions', keywords: ['password', 'security', 'change'] },
    { id: 'view-profile', label: 'My Profile', icon: User, href: '/admin/profile', category: 'actions', keywords: ['profile', 'account', 'me'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin/notifications', category: 'actions', keywords: ['notifications', 'alerts', 'messages'] },
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
                e.preventDefault()
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
            // Switch categories with Tab
            if (e.key === 'Tab') {
                e.preventDefault()
                setActiveCategory(cat => {
                    if (cat === 'restaurant') return 'admin'
                    if (cat === 'admin') return 'actions'
                    return 'restaurant'
                })
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, search, selectedIndex])

    // Filter actions based on category and search
    const filtered = ACTIONS
        .filter(a => {
            // Show all categories or specific one
            if (activeCategory === 'admin') {
                return a.category === 'admin' || a.category === 'actions'
            }
            return a.category === activeCategory
        })
        .filter(a => {
            const searchLower = search.toLowerCase()
            return (
                a.label.toLowerCase().includes(searchLower) ||
                a.keywords.some(k => k.includes(searchLower))
            )
        })

    useEffect(() => {
        setSelectedIndex(0)
    }, [search, activeCategory])

    const handleSelect = (action: typeof ACTIONS[0]) => {
        router.push(action.href)
        onClose()
    }

    // Group actions by category for better display
    const groupedActions = filtered.reduce((acc, action) => {
        const group = action.category === 'actions' ? 'Quick Actions' :
            action.category === 'admin' ? 'Admin' : 'Restaurant'
        if (!acc[group]) acc[group] = []
        acc[group].push(action)
        return acc
    }, {} as Record<string, typeof ACTIONS>)

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />

            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-20 md:pt-32 px-4">
                <div className="w-full max-w-2xl bg-[var(--card)] border-2 border-blue-600/50 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">

                    {/* Search Header */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
                        <Search className="w-5 h-5 text-blue-600" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${activeCategory === 'actions' ? 'quick actions' : activeCategory} commands...`}
                            className="flex-1 bg-transparent outline-none text-[var(--fg)] placeholder:text-[var(--muted)] text-lg"
                        />

                        {/* Category Tabs */}
                        <div className="flex gap-1 bg-[var(--bg)] rounded-lg p-1">
                            <button
                                onClick={() => setActiveCategory('restaurant')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    activeCategory === 'restaurant'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-[var(--muted)] hover:text-[var(--fg)]'
                                }`}
                                title="Restaurant commands"
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
                                title="Admin commands"
                            >
                                🛡️ Admin
                            </button>
                            <button
                                onClick={() => setActiveCategory('actions')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    activeCategory === 'actions'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-[var(--muted)] hover:text-[var(--fg)]'
                                }`}
                                title="Quick actions"
                            >
                                ⚡ Actions
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-[var(--muted)]" />
                                </div>
                                <p className="text-[var(--fg)] font-medium mb-1">No commands found</p>
                                <p className="text-sm text-[var(--muted)]">Try a different search term or category</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(groupedActions).map(([group, actions]) => (
                                    <div key={group}>
                                        {/* Group Header */}
                                        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                                            {group}
                                        </div>

                                        {/* Group Items */}
                                        <div className="space-y-1">
                                            {actions.map((action, idx) => {
                                                const Icon = action.icon
                                                const globalIdx = filtered.indexOf(action)
                                                const isSelected = globalIdx === selectedIndex

                                                return (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => handleSelect(action)}
                                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
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
                                <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">Tab</kbd>
                                Switch
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">ESC</kbd>
                                Close
                            </span>
                        </div>
                        <span className="hidden sm:flex items-center gap-1">
                            <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">⌘K</kbd>
                            Quick Actions
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}




// // src/components/CommandPalette.tsx
// "use client"
//
// import { useState, useEffect } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import {
//     Search, Plus, Package, Users, UtensilsCrossed,
//     ShoppingBag, LayoutGrid, Clock, TrendingUp,
//     FileSpreadsheet, Shield, Printer, ArrowLeftRight, RefreshCw
// } from 'lucide-react'
//
// interface CommandPaletteProps {
//     open: boolean
//     onClose: () => void
// }
//
// const ACTIONS = [
//     // Restaurant Actions
//     { id: 'new-order', label: 'Start New Order', icon: Plus, href: '/', category: 'restaurant', keywords: ['order', 'new', 'menu', 'food'] },
//     { id: 'view-tables', label: 'View All Tables', icon: LayoutGrid, href: '/tables', category: 'restaurant', keywords: ['table', 'dining', 'seating'] },
//     { id: 'view-orders', label: 'View Orders', icon: ShoppingBag, href: '/orders', category: 'restaurant', keywords: ['order', 'bill', 'receipt'] },
//
//     // Admin Actions
//     { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield, href: '/admin', category: 'admin', keywords: ['admin', 'dashboard', 'overview'] },
//     { id: 'manage-inventory', label: 'Manage Inventory', icon: Package, href: '/admin/inventory', category: 'admin', keywords: ['inventory', 'stock', 'items', 'supplies'] },
//     { id: 'manage-menu', label: 'Manage Menu', icon: UtensilsCrossed, href: '/admin/menu', category: 'admin', keywords: ['menu', 'food', 'items', 'dishes'] },
//     { id: 'manage-waiters', label: 'Manage Staff', icon: Users, href: '/admin/waiters', category: 'admin', keywords: ['staff', 'waiter', 'employee', 'team'] },
//     { id: 'manage-tables-admin', label: 'Manage Tables (Admin)', icon: LayoutGrid, href: '/admin/tables', category: 'admin', keywords: ['table', 'setup', 'configure'] },
//     { id: 'view-reports', label: 'Sales Reports', icon: FileSpreadsheet, href: '/admin/reports', category: 'admin', keywords: ['report', 'sales', 'analytics', 'revenue'] },
//     { id: 'manage-shifts', label: 'Manage Shifts', icon: Clock, href: '/admin/shifts', category: 'admin', keywords: ['shift', 'schedule', 'clock', 'attendance'] }
// ]
//
// export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
//     const router = useRouter()
//     const pathname = usePathname()
//     const [search, setSearch] = useState('')
//     const [selectedIndex, setSelectedIndex] = useState(0)
//
//     const currentSection = pathname.startsWith('/admin') ? 'admin' : 'restaurant'
//     const [activeCategory, setActiveCategory] = useState(currentSection)
//
//     useEffect(() => {
//         setActiveCategory(pathname.startsWith('/admin') ? 'admin' : 'restaurant')
//     }, [pathname])
//
//     useEffect(() => {
//         if (!open) {
//             setSearch('')
//             setSelectedIndex(0)
//             return
//         }
//
//         const down = (e: KeyboardEvent) => {
//             if (e.key === 'Escape') {
//                 onClose()
//             }
//             if (e.key === 'ArrowDown') {
//                 e.preventDefault()
//                 setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
//             }
//             if (e.key === 'ArrowUp') {
//                 e.preventDefault()
//                 setSelectedIndex(i => Math.max(i - 1, 0))
//             }
//             if (e.key === 'Enter' && filtered[selectedIndex]) {
//                 e.preventDefault()
//                 handleSelect(filtered[selectedIndex])
//             }
//         }
//         document.addEventListener('keydown', down)
//         return () => document.removeEventListener('keydown', down)
//     }, [open, search, selectedIndex])
//
//     const filtered = ACTIONS
//         .filter(a => a.category === activeCategory)
//         .filter(a => {
//             const searchLower = search.toLowerCase()
//             return (
//                 a.label.toLowerCase().includes(searchLower) ||
//                 a.keywords.some(k => k.includes(searchLower))
//             )
//         })
//
//     useEffect(() => {
//         setSelectedIndex(0)
//     }, [search])
//
//     const handleSelect = (action: typeof ACTIONS[0]) => {
//         router.push(action.href)
//         onClose()
//     }
//
//     if (!open) return null
//
//     return (
//         <>
//             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
//
//             <div className="fixed inset-0 z-[101] flex items-start justify-center pt-20 md:pt-32 px-4">
//                 <div className="w-full max-w-2xl bg-[var(--card)] border-2 border-blue-600/50 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">
//
//                     <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
//                         <Search className="w-5 h-5 text-blue-600" />
//                         <input
//                             autoFocus
//                             value={search}
//                             onChange={e => setSearch(e.target.value)}
//                             placeholder={`Search ${activeCategory === 'admin' ? 'admin' : 'restaurant'} actions...`}
//                             className="flex-1 bg-transparent outline-none text-[var(--fg)] placeholder:text-[var(--muted)] text-lg"
//                         />
//
//                         <div className="flex gap-1 bg-[var(--bg)] rounded-lg p-1">
//                             <button
//                                 onClick={() => setActiveCategory('restaurant')}
//                                 className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
//                                     activeCategory === 'restaurant'
//                                         ? 'bg-blue-600 text-white shadow-sm'
//                                         : 'text-[var(--muted)] hover:text-[var(--fg)]'
//                                 }`}
//                             >
//                                 🍽️ Restaurant
//                             </button>
//                             <button
//                                 onClick={() => setActiveCategory('admin')}
//                                 className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
//                                     activeCategory === 'admin'
//                                         ? 'bg-blue-600 text-white shadow-sm'
//                                         : 'text-[var(--muted)] hover:text-[var(--fg)]'
//                                 }`}
//                             >
//                                 🛡️ Admin
//                             </button>
//                         </div>
//                     </div>
//
//                     <div className="max-h-[60vh] overflow-y-auto p-2">
//                         {filtered.length === 0 ? (
//                             <div className="py-16 text-center">
//                                 <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-4">
//                                     <Search className="w-8 h-8 text-[var(--muted)]" />
//                                 </div>
//                                 <p className="text-[var(--fg)] font-medium mb-1">No actions found</p>
//                                 <p className="text-sm text-[var(--muted)]">Try a different search term</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-1">
//                                 {filtered.map((action, idx) => {
//                                     const Icon = action.icon
//                                     const isSelected = idx === selectedIndex
//
//                                     return (
//                                         <button
//                                             key={action.id}
//                                             onClick={() => handleSelect(action)}
//                                             onMouseEnter={() => setSelectedIndex(idx)}
//                                             className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group ${
//                                                 isSelected
//                                                     ? 'bg-blue-600 text-white'
//                                                     : 'hover:bg-[var(--bg)] text-[var(--fg)]'
//                                             }`}
//                                         >
//                                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
//                                                 isSelected
//                                                     ? 'bg-white/20'
//                                                     : 'bg-[var(--bg)] group-hover:bg-blue-600/10'
//                                             }`}>
//                                                 <Icon className={`w-5 h-5 ${
//                                                     isSelected ? 'text-white' : 'text-blue-600'
//                                                 }`} />
//                                             </div>
//
//                                             <div className="flex-1 text-left">
//                                                 <p className={`font-medium ${isSelected ? 'text-white' : 'text-[var(--fg)]'}`}>
//                                                     {action.label}
//                                                 </p>
//                                                 <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--muted)]'}`}>
//                                                     {action.href}
//                                                 </p>
//                                             </div>
//
//                                             {isSelected && (
//                                                 <kbd className="px-2 py-1 bg-white/20 text-white text-xs rounded border border-white/30">
//                                                     ↵
//                                                 </kbd>
//                                             )}
//                                         </button>
//                                     )
//                                 })}
//                             </div>
//                         )}
//                     </div>
//
//                     <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between text-xs text-[var(--muted)]">
//                         <div className="flex items-center gap-4">
//                             <span className="flex items-center gap-1">
//                                 <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↑</kbd>
//                                 <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↓</kbd>
//                                 Navigate
//                             </span>
//                             <span className="flex items-center gap-1">
//                                 <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">↵</kbd>
//                                 Select
//                             </span>
//                             <span className="flex items-center gap-1">
//                                 <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">ESC</kbd>
//                                 Close
//                             </span>
//                         </div>
//                         <span>
//                             <kbd className="px-2 py-0.5 bg-[var(--card)] rounded border border-[var(--border)]">⌘K</kbd>
//                             {' '}Quick Actions
//                         </span>
//                     </div>
//                 </div>
//             </div>
//         </>
//     )
// }
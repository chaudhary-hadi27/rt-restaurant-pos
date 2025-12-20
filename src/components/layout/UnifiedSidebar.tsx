"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UtensilsCrossed, LayoutGrid, ShoppingBag, Menu, X, Moon, Sun, Shield, Package, Users, ChefHat, Home, Command, Clock } from 'lucide-react'
import { useTheme } from '@/lib/store/theme-store'

const NAV = {
    public: [
        { label: 'Menu', icon: UtensilsCrossed, href: '/' },
        { label: 'Tables', icon: LayoutGrid, href: '/tables' },
        { label: 'Orders', icon: ShoppingBag, href: '/orders' },
        { label: 'Shifts', icon: Clock, href: '/shifts' },
    ],
    admin: [
        { label: 'Dashboard', icon: Home, href: '/admin' },
        { label: 'Inventory', icon: Package, href: '/admin/inventory' },
        { label: 'Menu', icon: ChefHat, href: '/admin/menu' },
        { label: 'Waiters', icon: Users, href: '/admin/waiters' },
        { label: 'Tables', icon: LayoutGrid, href: '/admin/tables' },
        { label: 'History', icon: Clock, href: '/admin/history' },
    ]
}

export default function UnifiedSidebar({ onCommandOpen }: { onCommandOpen?: () => void }) {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => setHydrated(true), [])
    if (!hydrated) return null

    const isAdmin = pathname.startsWith('/admin')
    const items = isAdmin ? NAV.admin : NAV.public

    return (
        <>
            {/* Mobile Toggle - Fixed position */}
            <button onClick={() => setOpen(!open)}
                    className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg active:scale-95">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Overlay */}
            {open && <div className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-screen w-16 bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

                {/* Logo */}
                <Link href={isAdmin ? '/admin' : '/'} className="h-16 flex items-center justify-center border-b border-[var(--border)] flex-shrink-0" onClick={() => setOpen(false)}>
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg hover:bg-blue-700 active:scale-95">RT</div>
                </Link>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 space-y-2 overflow-y-auto">
                    {items.map(item => {
                        const Icon = item.icon
                        const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href))
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="group relative block" title={item.label}>
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all active:scale-95 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--fg)] text-[var(--bg)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-[var(--border)] space-y-2 flex-shrink-0">
                    <button onClick={() => onCommandOpen?.()} className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-blue-600 transition-all active:scale-95 group relative" title="Quick Actions">
                        <Command className="w-5 h-5" />
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--fg)] text-[var(--bg)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                            Quick Actions <kbd className="ml-2 px-1.5 py-0.5 bg-[var(--bg)] text-[var(--fg)] text-xs rounded">⌘K</kbd>
                        </div>
                    </button>

                    <button onClick={toggleTheme} className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-all active:scale-95 group relative" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <Link href={isAdmin ? '/' : '/admin'} onClick={() => setOpen(false)} className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-blue-600 transition-all active:scale-95 group relative" title={isAdmin ? 'Restaurant' : 'Admin'}>
                        {isAdmin ? <UtensilsCrossed className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </Link>
                </div>
            </aside>
        </>
    )
}
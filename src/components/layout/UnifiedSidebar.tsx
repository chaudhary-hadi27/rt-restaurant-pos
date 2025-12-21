"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UtensilsCrossed, LayoutGrid, ShoppingBag, Moon, Sun, Shield, Package, Users, ChefHat, Home, Command, Timer, History, Settings } from 'lucide-react'
import { useTheme } from '@/lib/store/theme-store'

const NAV = {
    public: [
        { label: 'Menu', icon: UtensilsCrossed, href: '/' },
        { label: 'Tables', icon: LayoutGrid, href: '/tables' },
        { label: 'Orders', icon: ShoppingBag, href: '/orders' },
        { label: 'Attendance', icon: Timer, href: '/attendance' },
    ],
    admin: [
        { label: 'Dashboard', icon: Home, href: '/admin' },
        { label: 'Inventory', icon: Package, href: '/admin/inventory' },
        { label: 'Menu', icon: ChefHat, href: '/admin/menu' },
        { label: 'Waiters', icon: Users, href: '/admin/waiters' },
        { label: 'Tables', icon: LayoutGrid, href: '/admin/tables' },
        { label: 'Attendance', icon: Timer, href: '/admin/attendance' },
        { label: 'History', icon: History, href: '/admin/history' },
        { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ]
}

export default function UnifiedSidebar({ onCommandOpen }: { onCommandOpen?: () => void }) {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [touchStart, setTouchStart] = useState(0)

    useEffect(() => setHydrated(true), [])
    useEffect(() => setOpen(false), [pathname])

    if (!hydrated) return null

    const isAdmin = pathname.startsWith('/admin')
    const items = isAdmin ? NAV.admin : NAV.public

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX
        const diff = touchEnd - touchStart

        if (!open && touchStart < 50 && diff > 100) setOpen(true)
        if (open && diff < -50) setOpen(false)
    }

    return (
        <>
            {/* Swipe Zone */}
            <div
                className="lg:hidden fixed left-0 top-0 w-8 h-full z-30"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            />

            {/* Overlay */}
            {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-16 bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-50 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <Link href={isAdmin ? '/admin' : '/'} className="h-16 flex items-center justify-center border-b border-[var(--border)]" onClick={() => setOpen(false)}>
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg">RT</div>
                </Link>

                {/* ✅ FIXED: Navigation Items with Working Tooltips */}
                <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto scrollbar-hide">
                    {items.map(item => {
                        const Icon = item.icon
                        const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href))
                        return (
                            <div key={item.href} className="relative group">
                                <Link href={item.href} onClick={() => setOpen(false)} className="block">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </Link>
                                {/* ✅ Theme-Aware Tooltip */}
                                <span className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[70]">
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-[var(--border)] space-y-1">
                    {/* Command Button */}
                    <div className="relative group">
                        <button
                            onClick={() => { onCommandOpen?.(); setOpen(false) }}
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-all duration-200"
                        >
                            <Command className="w-5 h-5" />
                        </button>
                        <span className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[70]">
                            Quick Actions
                        </span>
                    </div>

                    {/* Theme Button */}
                    <div className="relative group">
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-all duration-200"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-blue-600" />
                            )}
                        </button>
                        <span className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[70]">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </div>

                    {/* Admin Toggle */}
                    <div className="relative group">
                        <Link
                            href={isAdmin ? '/' : '/admin'}
                            onClick={() => setOpen(false)}
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-all duration-200 block"
                        >
                            {isAdmin ? (
                                <UtensilsCrossed className="w-5 h-5" />
                            ) : (
                                <Shield className="w-5 h-5" />
                            )}
                        </Link>
                        <span className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[70]">
                            {isAdmin ? 'Restaurant' : 'Admin Panel'}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    )
}
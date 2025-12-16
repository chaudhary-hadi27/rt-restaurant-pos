"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { UtensilsCrossed, LayoutGrid, ShoppingBag, Menu, X, Moon, Sun, Shield } from 'lucide-react'
import { useTheme } from '@/lib/store/theme-store'
import { useHydration } from '@/lib/hooks/useHydration'

const NAV_ITEMS = [
    { label: 'Menu', icon: UtensilsCrossed, href: '/' },
    { label: 'Tables', icon: LayoutGrid, href: '/tables' },
    { label: 'Orders', icon: ShoppingBag, href: '/orders' }
]

export default function PublicSidebar() {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const hydrated = useHydration()

    // Don't render until hydrated to prevent mismatch
    if (!hydrated) return null

    // Don't show on admin routes
    if (pathname.startsWith('/admin')) return null

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setOpen(!open)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg"
            >
                {open ? <X className="w-5 h-5 text-[var(--fg)]" /> : <Menu className="w-5 h-5 text-[var(--fg)]" />}
            </button>

            {/* Mobile Overlay */}
            {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-screen w-16 bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-40 transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-[var(--border)]">
                    <Link href="/">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg hover:bg-blue-700 transition-colors">
                            R
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-2">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon
                        const active = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className="group relative block"
                                title={item.label}
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all cursor-pointer ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                {/* Tooltip */}
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--fg)] text-[var(--bg)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-[var(--border)] space-y-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-all group relative"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--fg)] text-[var(--bg)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </div>
                    </button>

                    {/* Admin Link */}
                    <Link
                        href="/admin"
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)] hover:text-blue-600 transition-all group relative"
                        title="Admin Panel"
                    >
                        <Shield className="w-5 h-5" />
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--fg)] text-[var(--bg)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                            Admin Panel
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    )
}
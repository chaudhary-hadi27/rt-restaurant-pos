"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Package, Users, LayoutGrid, ShoppingBag, UtensilsCrossed, Home, Menu, X, Moon, Sun, FileSpreadsheet } from 'lucide-react'
import { useTheme } from '@/lib/store/theme-store'

const NAV = [
    { label: 'Dashboard', icon: Home, href: '/admin' },
    { label: 'Inventory', icon: Package, href: '/admin/inventory' },
    { label: 'Menu', icon: UtensilsCrossed, href: '/admin/menu' },
    { label: 'Waiters', icon: Users, href: '/admin/waiters' },
    { label: 'Reports', icon: FileSpreadsheet, href: '/admin/reports' },
]

export default function Sidebar() {
    const path = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [open, setOpen] = useState(false)

    return (
        <>
            <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                {open ? <X className="w-5 h-5 text-[var(--fg)]" /> : <Menu className="w-5 h-5 text-[var(--fg)]" />}
            </button>

            {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />}

            <aside className={`fixed top-0 left-0 h-screen w-16 bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-40 transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-16 flex items-center justify-center border-b border-[var(--border)]">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">R</div>
                </div>

                <nav className="flex-1 py-4 px-2 space-y-2">
                    {NAV.map(n => {
                        const Icon = n.icon
                        const active = path === n.href || (n.href !== '/admin' && path.startsWith(n.href))

                        return (
                            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-blue-600 text-white' : 'text-[var(--muted)] hover:bg-[var(--bg)]'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-2 border-t border-[var(--border)]">
                    <button onClick={toggleTheme} className="w-12 h-12 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--bg)]">
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </aside>
        </>
    )
}
// src/components/layout/sidebar.tsx - UPDATED FOR /admin PATHS
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Package,
    Users,
    LayoutGrid,
    Settings,
    Menu,
    X,
    Moon,
    Sun,
    UtensilsCrossed,
    ShoppingBag,
    Home,
    User
} from 'lucide-react';
import { useTheme } from '@/lib/store/theme-store';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: Home, href: '/admin' },
    { label: 'Inventory', icon: Package, href: '/admin/inventory' },
    { label: 'Menu', icon: UtensilsCrossed, href: '/admin/menu' },
    { label: 'Waiters', icon: Users, href: '/admin/waiters' },
    { label: 'Tables', icon: LayoutGrid, href: '/admin/tables' },
    { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Users', icon: User, href: '/admin/users' }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
    }, [theme]);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
            >
                {mobileOpen ? (
                    <X className="w-5 h-5" style={{ color: 'var(--fg)' }} />
                ) : (
                    <Menu className="w-5 h-5" style={{ color: 'var(--fg)' }} />
                )}
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-16 border-r flex flex-col z-40 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b" style={{ borderColor: 'var(--border)' }}>
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        RT
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="w-12 h-12 rounded-lg flex items-center justify-center transition-all relative group"
                                style={{
                                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--muted)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                                        e.currentTarget.style.color = 'var(--fg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = 'var(--muted)';
                                    }
                                }}
                            >
                                <Icon className="w-5 h-5" />

                                {/* Tooltip */}
                                <div
                                    className="absolute left-full ml-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border"
                                    style={{
                                        backgroundColor: 'var(--card)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--fg)'
                                    }}
                                >
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme Toggle & Settings */}
                <div className="border-t p-2 space-y-2" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={toggleTheme}
                        className="w-12 h-12 rounded-lg flex items-center justify-center transition-all relative group"
                        style={{ color: 'var(--muted)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            e.currentTarget.style.color = 'var(--fg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--muted)';
                        }}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}

                        <div
                            className="absolute left-full ml-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border"
                            style={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                color: 'var(--fg)'
                            }}
                        >
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </div>
                    </button>

                    <Link
                        href="/admin/settings"
                        className="w-12 h-12 rounded-lg flex items-center justify-center transition-all relative group"
                        style={{ color: 'var(--muted)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            e.currentTarget.style.color = 'var(--fg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--muted)';
                        }}
                    >
                        <Settings className="w-5 h-5" />

                        <div
                            className="absolute left-full ml-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border"
                            style={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                color: 'var(--fg)'
                            }}
                        >
                            Settings
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
}
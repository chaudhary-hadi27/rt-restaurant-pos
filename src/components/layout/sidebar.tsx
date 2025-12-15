"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Users, LayoutGrid, Settings, Shield } from 'lucide-react';
import ThemeToggle from '@/components/layout/theme-toggle';

const navItems = [
    { href: '/inventory', icon: Package, label: 'Inventory' },
    { href: '/waiters', icon: Users, label: 'Waiters' },
    { href: '/tables', icon: LayoutGrid, label: 'Tables' },
    { href: '/admin', icon: Shield, label: 'Admin' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-0 top-0 h-screen w-16 border-r flex flex-col items-center py-6 gap-4"
            style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)'
            }}
        >
            {/* Logo */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg mb-8"
                style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff'
                }}
            >
                RT
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                        <div key={href} className="relative group">
                            <Link
                                href={href}
                                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--muted)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'var(--card)';
                                        e.currentTarget.style.filter = 'brightness(1.2)';
                                        e.currentTarget.style.color = 'var(--fg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.filter = 'none';
                                        e.currentTarget.style.color = 'var(--muted)';
                                    }
                                }}
                            >
                                <Icon className="w-5 h-5" />
                            </Link>

                            {/* Tooltip */}
                            <div
                                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border"
                                style={{
                                    backgroundColor: 'var(--card)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--fg)',
                                }}
                            >
                                {label}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Theme Toggle */}
            <ThemeToggle />
        </aside>
    );
}
// src/components/layout/AutoSidebar.tsx
"use client"

import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

interface SidebarItem {
    id: string
    label: string
    icon?: string
    count?: number
    active?: boolean
    onClick: () => void
}

interface AutoSidebarProps {
    items: SidebarItem[]
    title?: string
    variant?: 'nested' | 'filter' // nested = full sidebar, filter = horizontal bar
}

export default function AutoSidebar({ items, title, variant = 'nested' }: AutoSidebarProps) {
    const pathname = usePathname()

    if (!items || items.length === 0) return null

    // 📱 MOBILE: Horizontal Scroll Filter Bar
    if (variant === 'filter') {
        return (
            <div className="sticky top-16 lg:top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max">
                    {title && (
                        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mr-2">
              {title}
            </span>
                    )}
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                item.active
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)] hover:border-blue-600'
                            }`}
                        >
                            {item.icon && <span>{item.icon}</span>}
                            <span>{item.label}</span>
                            {item.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    item.active
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[var(--card)] text-[var(--muted)]'
                                }`}>
                  {item.count}
                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // 💻 DESKTOP: Nested Sidebar (Left Panel)
    return (
        <>
            {/* Desktop: Fixed Nested Sidebar */}
            <aside className="hidden lg:block fixed top-0 left-16 h-screen w-64 bg-[var(--card)] border-r border-[var(--border)] z-30">
                {title && (
                    <div className="h-16 flex items-center px-4 border-b border-[var(--border)]">
                        <h3 className="font-semibold text-[var(--fg)]">{title}</h3>
                    </div>
                )}

                <div className="p-2 space-y-1 overflow-y-auto" style={{ height: title ? 'calc(100vh - 64px)' : '100vh' }}>
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                item.active
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-[var(--fg)] hover:bg-[var(--bg)]'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                                <span className="truncate">{item.label}</span>
                            </div>
                            {item.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${
                                    item.active
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[var(--bg)] text-[var(--muted)]'
                                }`}>
                  {item.count}
                </span>
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Mobile: Top Filter Bar */}
            <div className="lg:hidden sticky top-16 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                item.active
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)]'
                            }`}
                        >
                            {item.icon && <span>{item.icon}</span>}
                            <span>{item.label}</span>
                            {item.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    item.active
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[var(--card)] text-[var(--muted)]'
                                }`}>
                  {item.count}
                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}

// 🎯 HOOK: Generate sidebar items from route config
export function useSidebarItems(routeConfig: any, currentFilter: string, onFilterChange: (id: string) => void) {
    return routeConfig.map((config: any) => ({
        id: config.id,
        label: config.label,
        icon: config.icon,
        count: config.count,
        active: currentFilter === config.id,
        onClick: () => onFilterChange(config.id)
    }))
}
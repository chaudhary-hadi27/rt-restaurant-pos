"use client"

import { X } from 'lucide-react'

export interface SidebarItem {
    id: string
    label: string
    icon?: string
    count?: number
    active?: boolean
    onClick: () => void
}

export default function AutoSidebar({ items, title }: { items: SidebarItem[]; title?: string }) {
    if (!items || items.length === 0) return null

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
                        <button key={item.id} onClick={item.onClick}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${item.active ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--fg)] hover:bg-[var(--bg)]'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                                {item.icon && <span className="flex-shrink-0 text-base">{item.icon}</span>}
                                <span className="truncate">{item.label}</span>
                            </div>
                            {item.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${item.active ? 'bg-white/20 text-white' : 'bg-[var(--bg)] text-[var(--muted)]'}`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Mobile: Horizontal scrollable chips - Fixed at top */}
            <div className="lg:hidden sticky top-16 z-20 bg-[var(--card)] border-b border-[var(--border)] px-3 py-2.5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3">
                    {items.map(item => (
                        <button key={item.id} onClick={item.onClick}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${item.active ? 'bg-blue-600 text-white shadow-md' : 'bg-[var(--bg)] text-[var(--fg)] border border-[var(--border)]'}`}>
                            {item.icon && <span className="text-sm">{item.icon}</span>}
                            <span>{item.label}</span>
                            {item.count !== undefined && (
                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${item.active ? 'bg-white/20 text-white' : 'bg-[var(--card)] text-[var(--muted)]'}`}>
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

export function useSidebarItems(routeConfig: any[], currentFilter: string, onFilterChange: (id: string) => void): SidebarItem[] {
    return routeConfig.map(config => ({
        id: config.id,
        label: config.label,
        icon: config.icon,
        count: config.count,
        active: currentFilter === config.id,
        onClick: () => onFilterChange(config.id)
    }))
}
// src/components/layout/NestedSidebar.tsx
"use client"

import { X } from 'lucide-react'

export interface NestedItem {
    id: string
    label: string
    icon?: string
    count?: number
    active?: boolean
    onClick: () => void
}

interface NestedSidebarProps {
    title: string
    items: NestedItem[]
    isOpen?: boolean
    onClose?: () => void
}

export default function NestedSidebar({ title, items, isOpen = true, onClose }: NestedSidebarProps) {
    // Don't render if no items
    if (!items || items.length === 0) return null

    return (
        <>
            {/* Desktop: Fixed Nested Sidebar (next to main sidebar) */}
            <aside className="hidden lg:block fixed top-0 left-16 h-screen w-64 bg-[var(--card)] border-r border-[var(--border)] z-30">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--fg)]">{title}</h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-[var(--bg)] rounded transition-colors"
                        >
                            <X className="w-4 h-4 text-[var(--muted)]" />
                        </button>
                    )}
                </div>

                {/* Items */}
                <div className="p-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
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
                            <div className="flex items-center gap-2">
                                {item.icon && <span>{item.icon}</span>}
                                <span>{item.label}</span>
                            </div>
                            {item.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
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

            {/* Mobile: Top Navbar (horizontal scroll) */}
            <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
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
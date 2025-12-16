"use client"

import { X } from 'lucide-react'

interface NestedItem {
    id: string
    name: string
    icon: string
    onClick?: () => void
    active?: boolean
}

interface NestedSidebarProps {
    title: string
    items: NestedItem[]
    onClose?: () => void
}

export function NestedSidebar({ title, items, onClose }: NestedSidebarProps) {
    return (
        <aside className="hidden lg:block fixed top-0 left-16 h-screen w-56 bg-[var(--card)] border-r border-[var(--border)] z-30">
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

            <div className="p-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
                {items.map(item => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            item.active
                                ? 'bg-blue-600 text-white'
                                : 'text-[var(--fg)] hover:bg-[var(--bg)]'
                        }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                    </button>
                ))}
            </div>
        </aside>
    )
}
// src/lib/utils/inventory-alerts.ts + Component
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, AlertTriangle, X, Package } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Alert = {
    id: string
    item_name: string
    quantity: number
    unit: string
    reorder_level: number
    read: boolean
}

type AlertStore = {
    alerts: Alert[]
    unreadCount: () => number
    addAlert: (alert: Omit<Alert, 'read'>) => void
    markAsRead: (id: string) => void
    clearAll: () => void
}

export const useAlerts = create<AlertStore>()(
    persist(
        (set, get) => ({
            alerts: [],

            unreadCount: () => {
                return get().alerts.filter(a => !a.read).length
            },

            addAlert: (alert) => set((state) => {
                // Check if alert already exists
                const exists = state.alerts.find(a => a.id === alert.id)
                if (exists) return state

                return {
                    alerts: [{ ...alert, read: false }, ...state.alerts]
                }
            }),

            markAsRead: (id) => set((state) => ({
                alerts: state.alerts.map(a =>
                    a.id === id ? { ...a, read: true } : a
                )
            })),

            clearAll: () => set({ alerts: [] })
        }),
        { name: 'inventory-alerts' }
    )
)

// Hook to check inventory and create alerts
export function useInventoryMonitor() {
    const { addAlert } = useAlerts()
    const supabase = createClient()

    useEffect(() => {
        checkInventory()

        const channel = supabase
            .channel('inventory_monitor')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'inventory_items'
            }, checkInventory)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const checkInventory = async () => {
        const { data: items } = await supabase
            .from('inventory_items')
            .select('id, name, quantity, unit, reorder_level')
            .eq('is_active', true)

        items?.forEach(item => {
            const percentage = (item.quantity / item.reorder_level) * 100

            if (percentage <= 50) {
                addAlert({
                    id: item.id,
                    item_name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    reorder_level: item.reorder_level
                })
            }
        })
    }
}

// Alert Bell Component
export function AlertBell() {
    const [open, setOpen] = useState(false)
    const { alerts, unreadCount, markAsRead, clearAll } = useAlerts()

    useInventoryMonitor()

    const unread = unreadCount()

    return (
        <div className="relative">
        <button
            onClick={() => setOpen(!open)}
    className="relative p-2 rounded-lg hover:bg-[var(--bg)] transition-colors"
    >
    <Bell className="w-5 h-5" style={{ color: 'var(--fg)' }} />
    {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread}
            </span>
    )}
    </button>

    {open && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
    <div
        className="absolute right-0 top-full mt-2 w-96 rounded-xl border shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
        <Bell className="w-5 h-5" style={{ color: '#3b82f6' }} />
    <h3 className="font-bold" style={{ color: 'var(--fg)' }}>
        Inventory Alerts
    </h3>
    </div>
        {alerts.length > 0 && (
            <button
                onClick={clearAll}
            className="text-xs font-medium hover:opacity-70"
            style={{ color: '#ef4444' }}
        >
            Clear All
        </button>
        )}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto">
            {alerts.length === 0 ? (
                    <div className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
    <p style={{ color: 'var(--muted)' }}>No alerts</p>
    </div>
    ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {alerts.map(alert => {
            const percentage = (alert.quantity / alert.reorder_level) * 100
            const isCritical = percentage <= 50

            return (
                <div
                    key={alert.id}
            className={`p-4 hover:bg-[var(--bg)] transition-colors ${!alert.read ? 'bg-blue-600/5' : ''}`}
        >
            <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCritical ? 'bg-red-600/20' : 'bg-yellow-600/20'
            }`}>
            <AlertTriangle
                className="w-5 h-5"
            style={{ color: isCritical ? '#ef4444' : '#f59e0b' }}
            />
            </div>

            <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
            {alert.item_name}
            </h4>
            {!alert.read && (
                <button
                    onClick={() => markAsRead(alert.id)}
                className="text-xs hover:opacity-70"
                style={{ color: '#3b82f6' }}
            >
                Mark Read
            </button>
            )}
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            Only {alert.quantity} {alert.unit} remaining
            </p>
            <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--bg)' }}>
            <div
                className="h-full rounded-full transition-all"
            style={{
                width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: isCritical ? '#ef4444' : '#f59e0b'
            }}
            />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {percentage.toFixed(0)}%
            </span>
            </div>
            </div>
            </div>
            </div>
        )
        })}
        </div>
    )}
        </div>
        </div>
        </>
    )}
    </div>
)
}

// Demo Usage
export default function AlertsDemo() {
    return (
        <div className="p-8">
        <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
    Inventory Alerts Demo
    </h1>
    <AlertBell />
    </div>

    <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
    <p style={{ color: 'var(--muted)' }}>
    Click the bell icon to see inventory alerts. The system automatically monitors stock levels and creates alerts when items fall below 50% of reorder level.
    </p>
    </div>
    </div>
)
}
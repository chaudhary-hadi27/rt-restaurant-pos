"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Package, Users, LayoutGrid, ShoppingBag, UtensilsCrossed, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
    const [stats, setStats] = useState({ inventory: 0, waiters: 0, tables: 0, orders: 0, revenue: 0 })
    const supabase = createClient()

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        const [inv, wait, tab, ord] = await Promise.all([
            supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
            supabase.from('waiters').select('id', { count: 'exact', head: true }),
            supabase.from('restaurant_tables').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('total_amount')
        ])

        const revenue = ord.data?.reduce((s, o) => s + o.total_amount, 0) || 0

        setStats({
            inventory: inv.count || 0,
            waiters: wait.count || 0,
            tables: tab.count || 0,
            orders: ord.data?.length || 0,
            revenue
        })
    }

    const cards = [
        { label: 'Inventory', value: stats.inventory, icon: Package, href: '/admin/inventory', color: '#3b82f6' },
        { label: 'Waiters', value: stats.waiters, icon: Users, href: '/admin/waiters', color: '#3b82f6' },
        { label: 'Tables', value: stats.tables, icon: LayoutGrid, href: '/admin/tables', color: '#3b82f6' },
        { label: 'Orders', value: stats.orders, icon: ShoppingBag, href: '/admin/orders', color: '#3b82f6' },
        { label: 'Menu', value: '-', icon: UtensilsCrossed, href: '/admin/menu', color: '#3b82f6' },
        { label: 'Revenue', value: `PKR ${stats.revenue.toLocaleString()}`, icon: DollarSign, href: '#', color: '#3b82f6' }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--fg)]">Dashboard</h1>
                <p className="text-[var(--muted)] mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map(c => {
                    const Icon = c.icon
                    return (
                        <Link key={c.label} href={c.href}>
                            <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-blue-600 transition-all cursor-pointer">
                                <Icon className="w-6 h-6 mb-3" style={{ color: c.color }} />
                                <p className="text-sm text-[var(--muted)] mb-1">{c.label}</p>
                                <p className="text-2xl font-bold text-[var(--fg)]">{c.value}</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
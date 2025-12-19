// src/app/admin/(pages)/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, DollarSign, ShoppingBag, Calendar } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'

export default function SalesReports() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
    const [stats, setStats] = useState({
        revenue: 0, orders: 0, avgOrder: 0, topItems: [] as any[], hourlyData: [] as any[]
    })
    const supabase = createClient()

    useEffect(() => { loadStats() }, [period])

    const loadStats = async () => {
        const now = new Date()
        let startDate = new Date()

        if (period === 'today') startDate.setHours(0, 0, 0, 0)
        else if (period === 'week') startDate.setDate(now.getDate() - 7)
        else startDate.setMonth(now.getMonth() - 1)

        const { data: orders } = await supabase.from('orders').select('total_amount, created_at').gte('created_at', startDate.toISOString()).eq('status', 'completed')
        const { data: items } = await supabase.from('order_items').select('menu_item_id, quantity, menu_items(name)').gte('created_at', startDate.toISOString())

        const revenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
        const orderCount = orders?.length || 0

        const itemMap = new Map()
        items?.forEach(item => {
            const id = item.menu_item_id
            const existing = itemMap.get(id) || { name: item.menu_items.name, quantity: 0 }
            existing.quantity += item.quantity
            itemMap.set(id, existing)
        })

        const topItems = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

        const hourlyMap = new Map()
        orders?.forEach(order => {
            const hour = new Date(order.created_at).getHours()
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + order.total_amount)
        })

        const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, amount: hourlyMap.get(i) || 0 }))

        setStats({ revenue, orders: orderCount, avgOrder: orderCount > 0 ? revenue / orderCount : 0, topItems, hourlyData })
    }

    const maxHourly = Math.max(...stats.hourlyData.map(d => d.amount), 1)

    const sidebarItems = useSidebarItems([
        { id: 'today', label: 'Today', icon: '📅', count: stats.orders },
        { id: 'week', label: 'This Week', icon: '📊', count: stats.orders },
        { id: 'month', label: 'This Month', icon: '📈', count: stats.orders }
    ], period, (id: string) => setPeriod(id as any))

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Report Period" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--fg)]">Sales Analytics</h1>
                            <p className="text-sm text-[var(--muted)] mt-1 capitalize">{period}'s performance</p>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Revenue', value: `PKR ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
                            { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: '#3b82f6' },
                            { label: 'Avg Order Value', value: `PKR ${stats.avgOrder.toFixed(0)}`, icon: TrendingUp, color: '#f59e0b' }
                        ].map(stat => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                                    <Icon className="w-8 h-8 mb-3" style={{ color: stat.color }} />
                                    <p className="text-sm text-[var(--muted)] mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-[var(--fg)]">{stat.value}</p>
                                </div>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--fg)]">
                                <Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                Hourly Sales
                            </h3>
                            <div className="flex items-end gap-1 h-48">
                                {stats.hourlyData.map(({ hour, amount }) => {
                                    const height = (amount / maxHourly) * 100
                                    return (
                                        <div key={hour} className="flex-1 flex flex-col items-center">
                                            <div className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer" style={{ height: `${height}%`, backgroundColor: '#3b82f6', minHeight: amount > 0 ? '8px' : '0' }} title={`${hour}:00 - PKR ${amount}`} />
                                            {hour % 3 === 0 && <span className="text-xs mt-2 text-[var(--muted)]">{hour}h</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--fg)]">
                                <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />
                                Top Selling Items
                            </h3>
                            <div className="space-y-3">
                                {stats.topItems.map((item, idx) => {
                                    const maxQty = stats.topItems[0]?.quantity || 1
                                    const percentage = (item.quantity / maxQty) * 100
                                    return (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-[var(--fg)]">{idx + 1}. {item.name}</span>
                                                <span className="text-sm
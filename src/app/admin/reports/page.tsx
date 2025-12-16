// src/app/(public)/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar } from 'lucide-react'

export default function SalesReports() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        avgOrder: 0,
        topItems: [] as any[],
        hourlyData: [] as any[]
    })
    const supabase = createClient()

    useEffect(() => {
        loadStats()
    }, [period])

    const loadStats = async () => {
        const now = new Date()
        let startDate = new Date()

        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0)
        } else if (period === 'week') {
            startDate.setDate(now.getDate() - 7)
        } else {
            startDate.setMonth(now.getMonth() - 1)
        }

        // Get orders
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed')

        // Get top selling items
        const { data: items } = await supabase
            .from('order_items')
            .select('menu_item_id, quantity, menu_items(name)')
            .gte('created_at', startDate.toISOString())

        const revenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
        const orderCount = orders?.length || 0

        // Group items by menu_item_id
        const itemMap = new Map()
        items?.forEach(item => {
            const id = item.menu_item_id
            const existing = itemMap.get(id) || { name: item.menu_items.name, quantity: 0 }
            existing.quantity += item.quantity
            itemMap.set(id, existing)
        })

        const topItems = Array.from(itemMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)

        // Hourly data for chart
        const hourlyMap = new Map()
        orders?.forEach(order => {
            const hour = new Date(order.created_at).getHours()
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + order.total_amount)
        })

        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            amount: hourlyMap.get(i) || 0
        }))

        setStats({
            revenue,
            orders: orderCount,
            avgOrder: orderCount > 0 ? revenue / orderCount : 0,
            topItems,
            hourlyData
        })
    }

    const maxHourly = Math.max(...stats.hourlyData.map(d => d.amount), 1)

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg)' }}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--fg)' }}>
                    Sales Analytics
                </h1>
                <div className="flex gap-2">
                    {(['today', 'week', 'month'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                                period === p ? 'bg-blue-600 text-white' : ''
                            }`}
                            style={period === p ? {} : { backgroundColor: 'var(--card)', color: 'var(--fg)' }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <DollarSign className="w-8 h-8 mb-3" style={{ color: '#10b981' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Total Revenue</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        PKR {stats.revenue.toLocaleString()}
                    </p>
                </div>

                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <ShoppingBag className="w-8 h-8 mb-3" style={{ color: '#3b82f6' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Total Orders</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        {stats.orders}
                    </p>
                </div>

                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <TrendingUp className="w-8 h-8 mb-3" style={{ color: '#f59e0b' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Avg Order Value</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        PKR {stats.avgOrder.toFixed(0)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Hourly Chart */}
                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                        <Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        Hourly Sales
                    </h3>
                    <div className="flex items-end gap-1 h-48">
                        {stats.hourlyData.map(({ hour, amount }) => {
                            const height = (amount / maxHourly) * 100
                            return (
                                <div key={hour} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: '#3b82f6',
                                            minHeight: amount > 0 ? '8px' : '0'
                                        }}
                                        title={`${hour}:00 - PKR ${amount}`}
                                    />
                                    {hour % 3 === 0 && (
                                        <span className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                      {hour}h
                    </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Top Items */}
                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
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
                    <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                      {idx + 1}. {item.name}
                    </span>
                                        <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                      {item.quantity} sold
                    </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg)' }}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: '#3b82f6'
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}

                        {stats.topItems.length === 0 && (
                            <p className="text-center py-8" style={{ color: 'var(--muted)' }}>
                                No data available
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
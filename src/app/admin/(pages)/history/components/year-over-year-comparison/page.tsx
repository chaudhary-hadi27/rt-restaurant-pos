'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function YearOverYearComparison() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadComparison()
    }, [])

    const loadComparison = async () => {
        const supabase = createClient()

        // Current year
        const thisYear = new Date().getFullYear()
        const thisYearStart = new Date(thisYear, 0, 1)
        const lastYearStart = new Date(thisYear - 1, 0, 1)
        const lastYearEnd = new Date(thisYear, 0, 1)

        try {
            const [thisYearOrders, lastYearOrders] = await Promise.all([
                supabase
                    .from('orders')
                    .select('total_amount, status')
                    .gte('created_at', thisYearStart.toISOString())
                    .eq('status', 'completed'),
                supabase
                    .from('orders')
                    .select('total_amount, status')
                    .gte('created_at', lastYearStart.toISOString())
                    .lt('created_at', lastYearEnd.toISOString())
                    .eq('status', 'completed')
            ])

            const thisYearData = thisYearOrders.data || []
            const lastYearData = lastYearOrders.data || []

            const thisYearRevenue = thisYearData.reduce((s, o) => s + (o.total_amount || 0), 0)
            const lastYearRevenue = lastYearData.reduce((s, o) => s + (o.total_amount || 0), 0)

            const revenueChange = lastYearRevenue > 0
                ? ((thisYearRevenue - lastYearRevenue) / lastYearRevenue) * 100
                : 0

            const ordersChange = lastYearData.length > 0
                ? ((thisYearData.length - lastYearData.length) / lastYearData.length) * 100
                : 0

            setData({
                thisYear: { revenue: thisYearRevenue, orders: thisYearData.length },
                lastYear: { revenue: lastYearRevenue, orders: lastYearData.length },
                revenueChange,
                ordersChange
            })
        } catch (error) {
            console.error('YoY comparison failed:', error)
        }

        setLoading(false)
    }

    if (loading) {
        return (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-[var(--bg)] rounded w-1/2" />
                    <div className="h-20 bg-[var(--bg)] rounded" />
                </div>
            </div>
        )
    }

    if (!data) return null

    const isRevenueUp = data.revenueChange > 0
    const isOrdersUp = data.ordersChange > 0

    return (
        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-2 border-blue-600/30 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[var(--fg)]">Year-over-Year Growth</h3>
                    <p className="text-sm text-[var(--muted)]">
                        {new Date().getFullYear()} vs {new Date().getFullYear() - 1}
                    </p>
                </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Revenue */}
                <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-[var(--muted)]">Revenue</p>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-xs text-[var(--muted)]">This Year</p>
                            <p className="text-2xl font-bold text-[var(--fg)]">
                                PKR {data.thisYear.revenue.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[var(--muted)]">Last Year</p>
                            <p className="text-lg font-semibold text-[var(--muted)]">
                                PKR {data.lastYear.revenue.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        isRevenueUp ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                        {isRevenueUp ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <p className={`font-bold ${isRevenueUp ? 'text-green-600' : 'text-red-600'}`}>
                            {isRevenueUp ? '+' : ''}{data.revenueChange.toFixed(1)}%
                        </p>
                        <p className="text-xs text-[var(--muted)]">vs last year</p>
                    </div>
                </div>

                {/* Orders */}
                <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-medium text-[var(--muted)]">Orders</p>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-xs text-[var(--muted)]">This Year</p>
                            <p className="text-2xl font-bold text-[var(--fg)]">
                                {data.thisYear.orders.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[var(--muted)]">Last Year</p>
                            <p className="text-lg font-semibold text-[var(--muted)]">
                                {data.lastYear.orders.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        isOrdersUp ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                        {isOrdersUp ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <p className={`font-bold ${isOrdersUp ? 'text-green-600' : 'text-red-600'}`}>
                            {isOrdersUp ? '+' : ''}{data.ordersChange.toFixed(1)}%
                        </p>
                        <p className="text-xs text-[var(--muted)]">vs last year</p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <p className="text-xs text-[var(--muted)]">
                    💡 <strong>Insight:</strong> {
                    isRevenueUp && isOrdersUp
                        ? 'Your business is growing! Both revenue and orders increased.'
                        : isRevenueUp
                            ? 'Revenue is up but order volume is down. Focus on customer retention.'
                            : 'Consider reviewing your strategy to boost growth.'
                }
                </p>
            </div>
        </div>
    )
}
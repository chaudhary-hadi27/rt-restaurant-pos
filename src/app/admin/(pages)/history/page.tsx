'use client'

import { useState, useEffect } from 'react'
import { Download, TrendingUp, ArrowUp, ArrowDown, Minus, BarChart3, Bell } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { getDateRange, getPreviousDateRange, loadWaiterReport, loadMenuReport, loadInventoryUsage, loadProfitLoss } from '@/lib/utils/historyHelpers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Category = 'waiters' | 'menu' | 'inventory' | 'profit'
type DateRange = 'today' | 'week' | 'month' | 'year'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function HistoryPage() {
    const [category, setCategory] = useState<Category>('profit')
    const [dateRange, setDateRange] = useState<DateRange>('week')
    const [data, setData] = useState<any[]>([])
    const [stats, setStats] = useState<any[]>([])
    const [comparison, setComparison] = useState<any>(null)
    const [alerts, setAlerts] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState<any[]>([])

    useEffect(() => { loadData() }, [category, dateRange])

    const loadData = async () => {
        setLoading(true)
        const { startDate, endDate } = getDateRange(dateRange)
        const prevRange = getPreviousDateRange(dateRange)

        try {
            if (category === 'waiters') {
                const { result, comparison: comp } = await loadWaiterReport(startDate, endDate, prevRange)
                setData(result)
                setComparison(comp)
                setChartData(result.slice(0, 8).map(w => ({
                    name: w.waiter_name.split(' ')[0],
                    revenue: w.total_revenue,
                    orders: w.total_orders
                })))
                setStats([
                    { label: 'Total Waiters', value: result.length, color: '#3b82f6' },
                    { label: 'Items Served', value: result.reduce((s, w) => s + w.total_items_served, 0), color: '#10b981' },
                    { label: 'Total Revenue', value: `PKR ${result.reduce((s, w) => s + w.total_revenue, 0).toLocaleString()}`, color: '#f59e0b', trend: comp.change }
                ])
                setAlerts([])
            } else if (category === 'menu') {
                const { result, comparison: comp } = await loadMenuReport(startDate, endDate, prevRange)
                const servedItems = result.filter(r => r.total_quantity > 0)
                setData(result)
                setComparison(comp)
                setChartData(servedItems.slice(0, 8).map(item => ({
                    name: item.item_name.substring(0, 15),
                    quantity: item.total_quantity,
                    revenue: item.total_revenue
                })))
                const notSold = result.filter(r => r.total_quantity === 0)
                setAlerts(notSold.length > 5 ? [`⚠️ ${notSold.length} items not sold`] : [])
                setStats([
                    { label: 'Total Items', value: result.length, color: '#3b82f6' },
                    { label: 'Items Sold', value: servedItems.length, color: '#10b981', trend: comp.change },
                    { label: 'Not Sold', value: notSold.length, color: '#ef4444' }
                ])
            } else if (category === 'inventory') {
                const { result } = await loadInventoryUsage()
                const lowStock = result.filter(i => i.status === 'Low Stock')
                setData(result)
                setComparison(null)
                setChartData(result.slice(0, 8).map(item => ({
                    name: item.item_name.substring(0, 12),
                    value: item.stock_value
                })))
                setAlerts(lowStock.length > 0 ? [`🔴 ${lowStock.length} items LOW STOCK`] : [])
                setStats([
                    { label: 'Total Items', value: result.length, color: '#3b82f6' },
                    { label: 'Low Stock', value: lowStock.length, color: '#ef4444' },
                    { label: 'Stock Value', value: `PKR ${result.reduce((s, i) => s + i.stock_value, 0).toLocaleString()}`, color: '#10b981' }
                ])
            } else {
                const { result: profitData, comparison: comp, netProfit } = await loadProfitLoss(startDate, endDate, prevRange)
                setData(profitData)
                setComparison(comp)
                setChartData(profitData.map(item => ({
                    category: item.category.substring(0, 15),
                    amount: item.amount
                })))
                const newAlerts = []
                if (netProfit < 0) newAlerts.push('🔴 Business running at LOSS')
                if (comp.trend === 'down' && comp.change > 20) newAlerts.push(`⚠️ Revenue dropped ${comp.change.toFixed(1)}%`)
                setAlerts(newAlerts)
                setStats([
                    { label: 'Revenue', value: `PKR ${profitData[0].amount.toLocaleString()}`, color: '#10b981', trend: comp.change },
                    { label: 'Costs', value: `PKR ${(profitData[2].amount + profitData[3].amount).toLocaleString()}`, color: '#ef4444' },
                    { label: netProfit >= 0 ? 'Profit' : 'Loss', value: `PKR ${Math.abs(netProfit).toLocaleString()}`, color: netProfit >= 0 ? '#10b981' : '#ef4444' }
                ])
            }
        } catch (error) {
            console.error('Error:', error)
        }
        setLoading(false)
    }

    const exportCSV = () => {
        if (!data.length) return
        const headers = Object.keys(data[0]).join(',')
        const rows = data.map(r => Object.values(r).join(',')).join('\n')
        const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${category}-${dateRange}-${Date.now()}.csv`
        a.click()
    }

    const columns = {
        waiters: [
            {
                key: 'waiter',
                label: 'Waiter',
                render: (r: any) => (
                    <div className="flex items-center gap-2">
                        {r.profile_pic ? (
                            <img src={r.profile_pic} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                {r.waiter_name?.[0] || '?'}
                            </div>
                        )}
                        <span className="font-medium text-[var(--fg)]">{r.waiter_name || 'N/A'}</span>
                    </div>
                )
            },
            { key: 'total_orders', label: 'Orders', render: (r: any) => <span className="text-[var(--fg)]">{r.total_orders || 0}</span> },
            { key: 'total_items_served', label: 'Items', render: (r: any) => <span className="text-[var(--fg)]">{r.total_items_served || 0}</span> },
            { key: 'top_item', label: 'Top Item', render: (r: any) => <span className="text-[var(--fg)]">{r.top_item || 'None'}</span> },
            {
                key: 'total_revenue',
                label: 'Revenue',
                align: 'right' as const,
                render: (r: any) => <span className="font-bold text-green-600">PKR {(r.total_revenue || 0).toLocaleString()}</span>
            }
        ],
        menu: [
            { key: 'item_name', label: 'Item', render: (r: any) => <span className="text-[var(--fg)]">{r.item_name || 'N/A'}</span> },
            { key: 'price', label: 'Price', render: (r: any) => <span className="text-[var(--fg)]">PKR {(r.price || 0).toLocaleString()}</span> },
            { key: 'total_quantity', label: 'Sold', render: (r: any) => <span className="text-[var(--fg)]">{r.total_quantity || 0}</span> },
            {
                key: 'available',
                label: 'Status',
                render: (r: any) => (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${r.available ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                        {r.available ? 'Available' : 'Unavailable'}
                    </span>
                )
            },
            {
                key: 'total_revenue',
                label: 'Revenue',
                align: 'right' as const,
                render: (r: any) => <span className="font-bold text-blue-600">PKR {(r.total_revenue || 0).toLocaleString()}</span>
            }
        ],
        inventory: [
            { key: 'item_name', label: 'Item', render: (r: any) => <span className="text-[var(--fg)]">{r.item_name || 'N/A'}</span> },
            { key: 'current_stock', label: 'Stock', render: (r: any) => <span className="text-[var(--fg)]">{r.current_stock || 0} {r.unit || ''}</span> },
            { key: 'purchase_price', label: 'Price/Unit', render: (r: any) => <span className="text-[var(--fg)]">PKR {(r.purchase_price || 0).toLocaleString()}</span> },
            {
                key: 'status',
                label: 'Status',
                render: (r: any) => (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${r.status === 'OK' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                        {r.status || 'OK'}
                    </span>
                )
            },
            {
                key: 'stock_value',
                label: 'Value',
                align: 'right' as const,
                render: (r: any) => <span className="font-bold text-[var(--fg)]">PKR {(r.stock_value || 0).toLocaleString()}</span>
            }
        ],
        profit: [
            { key: 'category', label: 'Category', render: (r: any) => <span className="text-[var(--fg)]">{r.category || 'N/A'}</span> },
            {
                key: 'type',
                label: 'Type',
                render: (r: any) => {
                    const colors: Record<string, string> = {
                        income: 'bg-green-500/20 text-green-600',
                        expense: 'bg-red-500/20 text-red-600',
                        profit: 'bg-blue-500/20 text-blue-600',
                        loss: 'bg-red-500/20 text-red-600',
                        neutral: 'bg-gray-500/20 text-gray-600'
                    }
                    return (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[r.type] || ''}`}>
                            {r.type?.toUpperCase() || 'N/A'}
                        </span>
                    )
                }
            },
            {
                key: 'amount',
                label: 'Amount',
                align: 'right' as const,
                render: (r: any) => {
                    const color = r.type === 'income' || r.type === 'profit' ? 'text-green-600' : r.type === 'expense' || r.type === 'loss' ? 'text-red-600' : 'text-gray-600'
                    return <span className={`font-bold text-lg ${color}`}>PKR {(r.amount || 0).toLocaleString()}</span>
                }
            }
        ]
    }

    const sidebarItems = useSidebarItems([
        { id: 'profit', label: 'Profit/Loss', icon: '💰', count: data.length },
        { id: 'waiters', label: 'Waiters', icon: '👤', count: data.length },
        { id: 'menu', label: 'Menu', icon: '🍽️', count: data.length },
        { id: 'inventory', label: 'Inventory', icon: '📦', count: data.length }
    ], category, (id: string) => setCategory(id as Category))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-[var(--fg)]">{payload[0].name}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs text-[var(--fg)]">
                            {entry.dataKey}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <ErrorBoundary>
            <>
                <AutoSidebar items={sidebarItems} title="Reports" />

                <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                    <PageHeader
                        title="History & Analytics"
                        subtitle="Business performance analysis"
                        action={
                            <div className="flex gap-2">
                                <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} className="px-2 sm:px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--fg)]">
                                    <option value="today">Today</option>
                                    <option value="week">Week</option>
                                    <option value="month">Month</option>
                                    <option value="year">Year</option>
                                </select>
                                <button onClick={exportCSV} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-xs sm:text-sm active:scale-95">
                                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">CSV</span>
                                </button>
                            </div>
                        }
                    />

                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {comparison && (
                            <div className={`p-3 sm:p-4 rounded-lg border-2 ${comparison.trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 border-green-600' : comparison.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 border-red-600' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-600'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {comparison.trend === 'up' ? <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> : comparison.trend === 'down' ? <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" /> : <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />}
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-[var(--muted)]">vs Previous Period</p>
                                            <p className={`text-xl sm:text-2xl font-bold ${comparison.trend === 'up' ? 'text-green-600' : comparison.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                                                {comparison.change.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm sm:text-base ${comparison.trend === 'up' ? 'bg-green-600 text-white' : comparison.trend === 'down' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'}`}>
                                        {comparison.trend === 'up' ? '↑' : comparison.trend === 'down' ? '↓' : '→'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {alerts.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-3 sm:p-4">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[var(--fg)] mb-2 text-sm sm:text-base">
                                            Alerts ({alerts.length})
                                        </h3>
                                        <ul className="space-y-1">
                                            {alerts.map((alert, idx) => (
                                                <li key={idx} className="text-xs sm:text-sm text-[var(--fg)] break-words">{alert}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <ResponsiveStatsGrid stats={stats} />

                        {chartData.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 sm:p-4 lg:p-6">
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        <h3 className="font-bold text-[var(--fg)] text-sm sm:text-base">Performance</h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="var(--muted)"
                                                tick={{ fill: 'var(--fg)', fontSize: 10 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                                interval={0}
                                            />
                                            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--fg)', fontSize: 10 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey={category === 'waiters' ? 'revenue' : category === 'menu' ? 'quantity' : category === 'profit' ? 'amount' : 'value'} fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 sm:p-4 lg:p-6">
                                    <h3 className="font-bold text-[var(--fg)] mb-3 sm:mb-4 text-sm sm:text-base">Distribution</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={chartData.slice(0, 6)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={false}
                                                outerRadius={60}
                                                fill="#8884d8"
                                                dataKey={category === 'waiters' ? 'revenue' : category === 'menu' ? 'quantity' : category === 'profit' ? 'amount' : 'value'}
                                            >
                                                {chartData.slice(0, 6).map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index]} />))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                wrapperStyle={{ fontSize: '10px' }}
                                                iconSize={8}
                                                formatter={(value, entry: any) => {
                                                    const val = entry.payload.value || entry.payload.revenue || entry.payload.amount || entry.payload.quantity || 0
                                                    const tot = chartData.slice(0, 6).reduce((s, d) => s + (d.value || d.revenue || d.amount || d.quantity || 0), 0)
                                                    const pct = tot > 0 ? ((val / tot) * 100).toFixed(0) : 0
                                                    return `${value.substring(0, 12)} (${pct}%)`
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <UniversalDataTable columns={columns[category]} data={data} loading={loading} searchable searchPlaceholder={`Search ${category}...`} />
                    </div>
                </div>
            </>
        </ErrorBoundary>
    )
}
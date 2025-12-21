'use client'

import { useState, useEffect } from 'react'
import { Download, TrendingUp, ArrowUp, ArrowDown, Minus, BarChart3, PieChart as PieIcon, Bell, AlertCircle } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { getDateRange, getPreviousDateRange, loadWaiterReport, loadMenuReport, loadInventoryUsage, loadProfitLoss } from '@/lib/utils/historyHelpers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Category = 'waiters' | 'menu' | 'inventory' | 'profit'
type DateRange = 'today' | 'week' | 'month'

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
                setChartData(result.slice(0, 10).map(w => ({
                    name: w.waiter_name,
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
                setChartData(servedItems.slice(0, 10).map(item => ({
                    name: item.item_name,
                    quantity: item.total_quantity,
                    revenue: item.total_revenue
                })))
                const notSold = result.filter(r => r.total_quantity === 0)
                setAlerts(notSold.length > 5 ? [`⚠️ ${notSold.length} menu items haven't sold - consider removing or promoting them`] : [])
                setStats([
                    { label: 'Total Items', value: result.length, color: '#3b82f6' },
                    { label: 'Items Sold', value: servedItems.length, color: '#10b981', trend: comp.change },
                    { label: 'Not Sold', value: notSold.length, color: '#ef4444', subtext: 'Need attention' }
                ])
            } else if (category === 'inventory') {
                const { result } = await loadInventoryUsage()
                const lowStock = result.filter(i => i.status === 'Low Stock')
                setData(result)
                setComparison(null)
                setChartData(result.slice(0, 10).map(item => ({
                    name: item.item_name,
                    value: item.stock_value
                })))
                setAlerts(lowStock.length > 0 ? [`🔴 ${lowStock.length} items are LOW STOCK - reorder immediately!`, ...lowStock.map(item => `  → ${item.item_name}: ${item.current_stock} ${item.unit}`)] : [])
                setStats([
                    { label: 'Total Items', value: result.length, color: '#3b82f6' },
                    { label: 'Low Stock', value: lowStock.length, color: '#ef4444', subtext: 'Need reorder' },
                    { label: 'Stock Value', value: `PKR ${result.reduce((s, i) => s + i.stock_value, 0).toLocaleString()}`, color: '#10b981' }
                ])
            } else {
                const { result: profitData, comparison: comp, netProfit } = await loadProfitLoss(startDate, endDate, prevRange)
                setData(profitData)
                setComparison(comp)
                setChartData(profitData.map(item => ({
                    category: item.category,
                    amount: item.amount
                })))
                const newAlerts = []
                if (netProfit < 0) newAlerts.push('🔴 ALERT: Business is running at a LOSS! Take immediate action.')
                if (comp.trend === 'down' && comp.change > 20) newAlerts.push(`⚠️ Revenue dropped by ${comp.change.toFixed(1)}% compared to previous period`)
                setAlerts(newAlerts)
                setStats([
                    { label: 'Revenue', value: `PKR ${profitData[0].amount.toLocaleString()}`, color: '#10b981', trend: comp.change },
                    { label: 'Costs', value: `PKR ${(profitData[2].amount + profitData[3].amount).toLocaleString()}`, color: '#ef4444' },
                    { label: netProfit >= 0 ? 'Profit' : 'Loss', value: `PKR ${Math.abs(netProfit).toLocaleString()}`, color: netProfit >= 0 ? '#10b981' : '#ef4444', subtext: netProfit >= 0 ? '✅ Positive' : '⚠️ Negative' }
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
                        <span className="font-medium">{r.waiter_name || 'N/A'}</span>
                    </div>
                )
            },
            { key: 'total_orders', label: 'Orders', render: (r: any) => r.total_orders || 0 },
            { key: 'total_items_served', label: 'Items Served', render: (r: any) => r.total_items_served || 0 },
            { key: 'top_item', label: 'Top Item', render: (r: any) => r.top_item || 'None' },
            {
                key: 'total_revenue',
                label: 'Revenue',
                align: 'right' as const,
                render: (r: any) => <span className="font-bold text-green-600">PKR {(r.total_revenue || 0).toLocaleString()}</span>
            }
        ],
        menu: [
            { key: 'item_name', label: 'Menu Item', render: (r: any) => r.item_name || 'N/A' },
            { key: 'price', label: 'Price', render: (r: any) => `PKR ${(r.price || 0).toLocaleString()}` },
            { key: 'total_quantity', label: 'Sold', render: (r: any) => r.total_quantity || 0 },
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
            { key: 'item_name', label: 'Item', render: (r: any) => r.item_name || 'N/A' },
            { key: 'current_stock', label: 'Stock', render: (r: any) => `${r.current_stock || 0} ${r.unit || ''}` },
            { key: 'purchase_price', label: 'Price/Unit', render: (r: any) => `PKR ${(r.purchase_price || 0).toLocaleString()}` },
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
                render: (r: any) => <span className="font-bold">PKR {(r.stock_value || 0).toLocaleString()}</span>
            }
        ],
        profit: [
            { key: 'category', label: 'Category', render: (r: any) => r.category || 'N/A' },
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
        { id: 'waiters', label: 'Waiter Reports', icon: '👤', count: data.length },
        { id: 'menu', label: 'Menu Analysis', icon: '🍽️', count: data.length },
        { id: 'inventory', label: 'Stock Usage', icon: '📦', count: data.length }
    ], category, (id: string) => setCategory(id as Category))

    return (
        <ErrorBoundary>
            <>
                <AutoSidebar items={sidebarItems} title="Reports" />

                <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                    <PageHeader
                        title="Business Analytics"
                        subtitle="Detailed performance & financial analysis"
                        action={
                            <div className="flex gap-2">
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                                    className="px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                                <button
                                    onClick={exportCSV}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm active:scale-95"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">CSV</span>
                                </button>
                            </div>
                        }
                    />

                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {/* Comparison Card */}
                        {comparison && (
                            <div className={`p-4 rounded-lg border-2 ${comparison.trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 border-green-600' : comparison.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 border-red-600' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-600'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {comparison.trend === 'up' ? (
                                            <ArrowUp className="w-6 h-6 text-green-600" />
                                        ) : comparison.trend === 'down' ? (
                                            <ArrowDown className="w-6 h-6 text-red-600" />
                                        ) : (
                                            <Minus className="w-6 h-6 text-gray-600" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-[var(--muted)]">vs Previous Period</p>
                                            <p className={`text-2xl font-bold ${comparison.trend === 'up' ? 'text-green-600' : comparison.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                                                {comparison.change.toFixed(1)}% {comparison.trend === 'up' ? 'increase' : comparison.trend === 'down' ? 'decrease' : 'no change'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts */}
                        {alerts.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                                            Important Alerts
                                            <span className="px-2 py-0.5 bg-yellow-600 text-white rounded-full text-xs">{alerts.length}</span>
                                        </h3>
                                        <ul className="space-y-1">
                                            {alerts.map((alert, idx) => (
                                                <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200">{alert}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <ResponsiveStatsGrid stats={stats} />

                        {/* Charts Section */}
                        {chartData.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Bar Chart */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-[var(--fg)]">
                                            {category === 'waiters' ? 'Revenue by Waiter' :
                                                category === 'menu' ? 'Top Selling Items' :
                                                    category === 'profit' ? 'Financial Breakdown' : 'Stock Value'}
                                        </h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="var(--muted)"
                                                tick={{ fill: 'var(--muted)' }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--card)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    color: 'var(--fg)'
                                                }}
                                            />
                                            <Bar
                                                dataKey={
                                                    category === 'waiters' ? 'revenue' :
                                                        category === 'menu' ? 'quantity' :
                                                            category === 'profit' ? 'amount' :
                                                                'value'
                                                }
                                                fill="#3b82f6"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Pie Chart - FIXED */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <PieIcon className="w-5 h-5 text-green-600" />
                                        <h3 className="font-bold text-[var(--fg)]">Distribution</h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={chartData.slice(0, 6)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry: any) => {
                                                    const value = entry.value || entry.revenue || entry.amount || entry.quantity || 0
                                                    const total = chartData.reduce((s, d) => s + (d.value || d.revenue || d.amount || d.quantity || 0), 0)
                                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0
                                                    return `${entry.name}: ${percentage}%`
                                                }}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey={
                                                    category === 'waiters' ? 'revenue' :
                                                        category === 'menu' ? 'quantity' :
                                                            category === 'profit' ? 'amount' :
                                                                'value'
                                                }
                                            >
                                                {chartData.slice(0, 6).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--card)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    color: 'var(--fg)'
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Data Table */}
                        <UniversalDataTable
                            columns={columns[category]}
                            data={data}
                            loading={loading}
                            searchable
                            searchPlaceholder={`Search ${category}...`}
                        />
                    </div>
                </div>
            </>
        </ErrorBoundary>
    )
}
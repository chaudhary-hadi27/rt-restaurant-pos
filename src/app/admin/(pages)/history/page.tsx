// src/app/admin/(pages)/history/page.tsx - FIXED
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import RevenueChart from '@/components/features/reports/RevenueChart'
import DistributionPie from '@/components/features/reports/DistributionPie'
import ReportFilters from '@/components/features/reports/ReportFilters'
import ComparisonBanner from '@/components/features/reports/ComparisonBanner'
import { getDateRange, getPreviousDateRange, loadWaiterReport, loadMenuReport, loadInventoryUsage, loadProfitLoss } from '@/lib/utils/historyHelpers'
import { ErrorBoundary } from '@/components/ErrorBoundary'

type Category = 'waiters' | 'menu' | 'inventory' | 'profit'
type DateRange = 'today' | 'week' | 'month' | 'year'

// ✅ ADD TYPE DEFINITIONS
type MenuReportItem = {
    item_name: string
    price: number
    available: boolean
    total_quantity: number
    total_revenue: number
}

type WaiterReportItem = {
    waiter_name: string
    profile_pic?: string
    total_orders: number
    total_items_served: number
    total_revenue: number
    top_item?: string
}

type InventoryReportItem = {
    item_name: string
    current_stock: number
    unit: string
    purchase_price: number
    reorder_level: number
    stock_value: number
    status: string
}

type ProfitLossItem = {
    category: string
    amount: number
    type: 'income' | 'expense' | 'neutral' | 'profit' | 'loss'
}

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
                const typedResult = result as WaiterReportItem[]

                setData(typedResult)
                setComparison(comp)
                setChartData(typedResult.slice(0, 8).map(w => ({
                    name: w.waiter_name.split(' ')[0],
                    revenue: w.total_revenue,
                    orders: w.total_orders
                })))
                setStats([
                    { label: 'Total Waiters', value: typedResult.length, color: '#3b82f6' },
                    { label: 'Items Served', value: typedResult.reduce((s, w) => s + w.total_items_served, 0), color: '#10b981' },
                    { label: 'Total Revenue', value: `PKR ${typedResult.reduce((s, w) => s + w.total_revenue, 0).toLocaleString()}`, color: '#f59e0b', trend: comp.change }
                ])
                setAlerts([])
            } else if (category === 'menu') {
                const { result, comparison: comp } = await loadMenuReport(startDate, endDate, prevRange)
                const typedResult = result as MenuReportItem[] // ✅ TYPE ASSERTION

                const servedItems = typedResult.filter(r => r.total_quantity > 0) // ✅ NOW TYPESCRIPT KNOWS THE TYPE

                setData(typedResult)
                setComparison(comp)
                setChartData(servedItems.slice(0, 8).map(item => ({
                    name: item.item_name.substring(0, 15),
                    quantity: item.total_quantity,
                    revenue: item.total_revenue
                })))

                const notSold = typedResult.filter(r => r.total_quantity === 0)
                setAlerts(notSold.length > 5 ? [`⚠️ ${notSold.length} items not sold`] : [])
                setStats([
                    { label: 'Total Items', value: typedResult.length, color: '#3b82f6' },
                    { label: 'Items Sold', value: servedItems.length, color: '#10b981', trend: comp.change },
                    { label: 'Not Sold', value: notSold.length, color: '#ef4444' }
                ])
            } else if (category === 'inventory') {
                const { result } = await loadInventoryUsage()
                const typedResult = result as InventoryReportItem[]

                const lowStock = typedResult.filter(i => i.status === 'Low Stock')
                setData(typedResult)
                setComparison(null)
                setChartData(typedResult.slice(0, 8).map(item => ({
                    name: item.item_name.substring(0, 12),
                    value: item.stock_value
                })))
                setAlerts(lowStock.length > 0 ? [`🔴 ${lowStock.length} items LOW STOCK`] : [])
                setStats([
                    { label: 'Total Items', value: typedResult.length, color: '#3b82f6' },
                    { label: 'Low Stock', value: lowStock.length, color: '#ef4444' },
                    { label: 'Stock Value', value: `PKR ${typedResult.reduce((s, i) => s + i.stock_value, 0).toLocaleString()}`, color: '#10b981' }
                ])
            } else {
                const { result: profitData, comparison: comp, netProfit } = await loadProfitLoss(startDate, endDate, prevRange)
                const typedResult = profitData as ProfitLossItem[]

                setData(typedResult)
                setComparison(comp)
                setChartData(typedResult.map(item => ({
                    name: item.category.substring(0, 15),
                    amount: item.amount
                })))

                const newAlerts = []
                if (netProfit < 0) newAlerts.push('🔴 Business running at LOSS')
                if (comp.trend === 'down' && comp.change > 20) newAlerts.push(`⚠️ Revenue dropped ${comp.change.toFixed(1)}%`)
                setAlerts(newAlerts)
                setStats([
                    { label: 'Revenue', value: `PKR ${typedResult[0].amount.toLocaleString()}`, color: '#10b981', trend: comp.change },
                    { label: 'Costs', value: `PKR ${(typedResult[2].amount + typedResult[3].amount).toLocaleString()}`, color: '#ef4444' },
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

    const columns = useMemo(() => {
        const configs: Record<Category, any[]> = {
            waiters: [
                { key: 'waiter', label: 'Waiter', render: (r: WaiterReportItem) => (
                        <div className="flex items-center gap-2">
                            {r.profile_pic ? <img src={r.profile_pic} alt="" className="w-8 h-8 rounded-full" /> :
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{r.waiter_name?.[0] || '?'}</div>}
                            <span className="font-medium text-[var(--fg)]">{r.waiter_name || 'N/A'}</span>
                        </div>
                    )},
                { key: 'total_orders', label: 'Orders', render: (r: WaiterReportItem) => <span className="text-[var(--fg)]">{r.total_orders || 0}</span> },
                { key: 'total_revenue', label: 'Revenue', align: 'right' as const, render: (r: WaiterReportItem) => <span className="font-bold text-green-600">PKR {(r.total_revenue || 0).toLocaleString()}</span> }
            ],
            menu: [
                { key: 'item_name', label: 'Item', render: (r: MenuReportItem) => <span className="text-[var(--fg)]">{r.item_name || 'N/A'}</span> },
                { key: 'total_quantity', label: 'Sold', render: (r: MenuReportItem) => <span className="text-[var(--fg)]">{r.total_quantity || 0}</span> },
                { key: 'total_revenue', label: 'Revenue', align: 'right' as const, render: (r: MenuReportItem) => <span className="font-bold text-blue-600">PKR {(r.total_revenue || 0).toLocaleString()}</span> }
            ],
            inventory: [
                { key: 'item_name', label: 'Item', render: (r: InventoryReportItem) => <span className="text-[var(--fg)]">{r.item_name || 'N/A'}</span> },
                { key: 'current_stock', label: 'Stock', render: (r: InventoryReportItem) => <span className="text-[var(--fg)]">{r.current_stock || 0} {r.unit || ''}</span> },
                { key: 'stock_value', label: 'Value', align: 'right' as const, render: (r: InventoryReportItem) => <span className="font-bold">PKR {(r.stock_value || 0).toLocaleString()}</span> }
            ],
            profit: [
                { key: 'category', label: 'Category', render: (r: ProfitLossItem) => <span className="text-[var(--fg)]">{r.category || 'N/A'}</span> },
                { key: 'amount', label: 'Amount', align: 'right' as const, render: (r: ProfitLossItem) => {
                        const color = r.type === 'income' || r.type === 'profit' ? 'text-green-600' : r.type === 'expense' || r.type === 'loss' ? 'text-red-600' : 'text-gray-600'
                        return <span className={`font-bold text-lg ${color}`}>PKR {(r.amount || 0).toLocaleString()}</span>
                    }}
            ]
        }
        return configs[category]
    }, [category])

    const sidebarItems = useSidebarItems([
        { id: 'profit', label: 'Profit/Loss', icon: '💰', count: data.length },
        { id: 'waiters', label: 'Waiters', icon: '👤', count: data.length },
        { id: 'menu', label: 'Menu', icon: '🍽️', count: data.length },
        { id: 'inventory', label: 'Inventory', icon: '📦', count: data.length }
    ], category, (id: string) => setCategory(id as Category))

    const chartKey = category === 'waiters' ? 'revenue' : category === 'menu' ? 'quantity' : category === 'profit' ? 'amount' : 'value'

    return (
        <ErrorBoundary>
            <>
                <AutoSidebar items={sidebarItems} title="Reports" />
                <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                    <PageHeader title="History & Analytics" subtitle="Business performance analysis"
                                action={<ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange} onExport={exportCSV} />} />

                    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                        {comparison && <ComparisonBanner comparison={comparison} />}

                        {alerts.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--fg)] mb-2">Alerts ({alerts.length})</h3>
                                        <ul className="space-y-1">
                                            {alerts.map((alert, idx) => <li key={idx} className="text-sm text-[var(--fg)]">{alert}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <ResponsiveStatsGrid stats={stats} />

                        {chartData.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <RevenueChart data={chartData} dataKey={chartKey} title="Performance" />
                                <DistributionPie data={chartData} dataKey={chartKey} title="Distribution" />
                            </div>
                        )}

                        <UniversalDataTable columns={columns} data={data} loading={loading} searchable />
                    </div>
                </div>
            </>
        </ErrorBoundary>
    )
}
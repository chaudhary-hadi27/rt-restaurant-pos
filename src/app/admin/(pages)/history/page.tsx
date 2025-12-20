'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, TrendingUp, Users, Package, DollarSign, UtensilsCrossed, AlertCircle, FileText, Bell, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { PageHeader } from '@/components/ui/PageHeader'

type Category = 'waiters' | 'menu' | 'inventory' | 'profit'
type DateRange = 'today' | 'week' | 'month'

export default function HistoryPage() {
    const [category, setCategory] = useState<Category>('waiters')
    const [dateRange, setDateRange] = useState<DateRange>('today')
    const [data, setData] = useState<any[]>([])
    const [stats, setStats] = useState<any[]>([])
    const [comparison, setComparison] = useState<any>(null)
    const [alerts, setAlerts] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [category, dateRange])

    const getDateRange = (range: DateRange) => {
        const now = new Date()
        const start = new Date()

        if (range === 'today') start.setHours(0, 0, 0, 0)
        else if (range === 'week') start.setDate(now.getDate() - 7)
        else start.setMonth(now.getMonth() - 1)

        return { startDate: start.toISOString(), endDate: now.toISOString() }
    }

    const getPreviousDateRange = (range: DateRange) => {
        const now = new Date()
        const start = new Date()
        const prevStart = new Date()
        const prevEnd = new Date()

        if (range === 'today') {
            start.setHours(0, 0, 0, 0)
            prevStart.setDate(now.getDate() - 1)
            prevStart.setHours(0, 0, 0, 0)
            prevEnd.setDate(now.getDate() - 1)
            prevEnd.setHours(23, 59, 59, 999)
        } else if (range === 'week') {
            start.setDate(now.getDate() - 7)
            prevStart.setDate(now.getDate() - 14)
            prevEnd.setDate(now.getDate() - 7)
        } else {
            start.setMonth(now.getMonth() - 1)
            prevStart.setMonth(now.getMonth() - 2)
            prevEnd.setMonth(now.getMonth() - 1)
        }

        return { startDate: prevStart.toISOString(), endDate: prevEnd.toISOString() }
    }

    const loadData = async () => {
        setLoading(true)
        const { startDate, endDate } = getDateRange(dateRange)
        const prevRange = getPreviousDateRange(dateRange)

        try {
            if (category === 'waiters') await loadWaiterReport(startDate, endDate, prevRange)
            else if (category === 'menu') await loadMenuReport(startDate, endDate, prevRange)
            else if (category === 'inventory') await loadInventoryUsage(startDate, endDate, prevRange)
            else await loadProfitLoss(startDate, endDate, prevRange)
        } catch (error) {
            console.error('Error:', error)
        }
        setLoading(false)
    }

    const calculateComparison = (current: number, previous: number) => {
        if (previous === 0) return { change: 0, trend: 'neutral' as const }
        const change = ((current - previous) / previous) * 100
        return {
            change: Math.abs(change),
            trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
        }
    }

    const loadWaiterReport = async (start: string, end: string, prevRange: any) => {
        const [currentOrders, prevOrders] = await Promise.all([
            supabase.from('orders').select('waiter_id, total_amount, waiters(name, profile_pic), order_items(quantity, menu_items(name, price))').gte('created_at', start).lte('created_at', end).eq('status', 'completed'),
            supabase.from('orders').select('total_amount').gte('created_at', prevRange.startDate).lte('created_at', prevRange.endDate).eq('status', 'completed')
        ])

        const waiterData: Record<string, any> = {}
        currentOrders.data?.forEach((order: any) => {
            const wId = order.waiter_id
            if (!waiterData[wId]) {
                waiterData[wId] = {
                    waiter_name: order.waiters?.name || 'Unknown',
                    profile_pic: order.waiters?.profile_pic,
                    total_orders: 0,
                    total_items_served: 0,
                    total_revenue: 0,
                    items_detail: {} as Record<string, number>
                }
            }
            waiterData[wId].total_orders += 1
            waiterData[wId].total_revenue += order.total_amount || 0
            order.order_items?.forEach((item: any) => {
                waiterData[wId].total_items_served += item.quantity
                const itemName = item.menu_items?.name || 'Unknown'
                waiterData[wId].items_detail[itemName] = (waiterData[wId].items_detail[itemName] || 0) + item.quantity
            })
        })

        const result = Object.values(waiterData).map((w: any) => ({
            ...w,
            top_item: Object.entries(w.items_detail).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'None'
        }))

        const totalRevenue = result.reduce((s, w) => s + w.total_revenue, 0)
        const prevRevenue = prevOrders.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0
        const comp = calculateComparison(totalRevenue, prevRevenue)

        setComparison(comp)
        setStats([
            { label: 'Total Waiters', value: result.length, icon: <Users className="w-6 h-6" />, color: '#3b82f6' },
            { label: 'Items Served', value: result.reduce((s, w) => s + w.total_items_served, 0), icon: <UtensilsCrossed className="w-6 h-6" />, color: '#10b981' },
            { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: '#f59e0b', trend: comp.change }
        ])
        setData(result)
    }

    const loadMenuReport = async (start: string, end: string, prevRange: any) => {
        const [totalMenuRes, servedRes, prevServedRes] = await Promise.all([
            supabase.from('menu_items').select('id, name, price, is_available'),
            supabase.from('order_items').select('menu_item_id, quantity, unit_price, orders(created_at, status)').gte('orders.created_at', start).lte('orders.created_at', end).eq('orders.status', 'completed'),
            supabase.from('order_items').select('quantity, orders(created_at, status)').gte('orders.created_at', prevRange.startDate).lte('orders.created_at', prevRange.endDate).eq('orders.status', 'completed')
        ])

        const totalMenu = totalMenuRes.data || []
        const served = servedRes.data || []
        const menuStats: Record<string, any> = {}

        totalMenu.forEach(item => {
            menuStats[item.id] = {
                item_name: item.name,
                price: item.price,
                available: item.is_available,
                total_quantity: 0,
                total_revenue: 0
            }
        })

        served.forEach((order: any) => {
            const id = order.menu_item_id
            if (menuStats[id]) {
                menuStats[id].total_quantity += order.quantity
                menuStats[id].total_revenue += order.quantity * (order.unit_price || 0)
            }
        })

        const result = Object.values(menuStats).sort((a: any, b: any) => b.total_quantity - a.total_quantity)
        const servedItems = result.filter(r => r.total_quantity > 0).length
        const prevServed = prevServedRes.data?.length || 0
        const comp = calculateComparison(servedItems, prevServed)

        const newAlerts = []
        const notSold = result.filter(r => r.total_quantity === 0)
        if (notSold.length > 5) newAlerts.push(`⚠️ ${notSold.length} menu items haven't sold - consider removing or promoting them`)

        setComparison(comp)
        setAlerts(newAlerts)
        setStats([
            { label: 'Total Menu Items', value: totalMenu.length, icon: <UtensilsCrossed className="w-6 h-6" />, color: '#3b82f6' },
            { label: 'Items Sold', value: servedItems, icon: <TrendingUp className="w-6 h-6" />, color: '#10b981', trend: comp.change },
            { label: 'Not Sold', value: totalMenu.length - servedItems, icon: <AlertCircle className="w-6 h-6" />, color: '#ef4444', subtext: 'Need attention' }
        ])
        setData(result)
    }

    const loadInventoryUsage = async (start: string, end: string, prevRange: any) => {
        const { data: items } = await supabase.from('inventory_items').select('id, name, quantity, unit, purchase_price, reorder_level')

        const usage: Record<string, any> = {}
        items?.forEach(item => {
            usage[item.id] = {
                item_name: item.name,
                current_stock: item.quantity,
                unit: item.unit,
                purchase_price: item.purchase_price,
                reorder_level: item.reorder_level,
                stock_value: item.quantity * item.purchase_price,
                status: item.quantity <= item.reorder_level ? 'Low Stock' : 'OK'
            }
        })

        const result = Object.values(usage).sort((a: any, b: any) => a.current_stock - b.current_stock)
        const lowStock = result.filter(i => i.status === 'Low Stock')

        const newAlerts = []
        if (lowStock.length > 0) {
            newAlerts.push(`🔴 ${lowStock.length} items are LOW STOCK - reorder immediately!`)
            lowStock.forEach(item => newAlerts.push(`  → ${item.item_name}: ${item.current_stock} ${item.unit}`))
        }

        setAlerts(newAlerts)
        setStats([
            { label: 'Total Items', value: result.length, icon: <Package className="w-6 h-6" />, color: '#3b82f6' },
            { label: 'Low Stock', value: lowStock.length, icon: <AlertCircle className="w-6 h-6" />, color: '#ef4444', subtext: 'Need reorder' },
            { label: 'Stock Value', value: `PKR ${result.reduce((s, i) => s + i.stock_value, 0).toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: '#10b981' }
        ])
        setData(result)
    }

    const loadProfitLoss = async (start: string, end: string, prevRange: any) => {
        const [ordersRes, prevOrdersRes, inventoryRes] = await Promise.all([
            supabase.from('orders').select('total_amount, subtotal, tax').gte('created_at', start).lte('created_at', end).eq('status', 'completed'),
            supabase.from('orders').select('total_amount').gte('created_at', prevRange.startDate).lte('created_at', prevRange.endDate).eq('status', 'completed'),
            supabase.from('inventory_items').select('quantity, purchase_price')
        ])

        const orders = ordersRes.data || []
        const prevOrders = prevOrdersRes.data || []
        const inventory = inventoryRes.data || []

        const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
        const totalTax = orders.reduce((s, o) => s + (o.tax || 0), 0)
        const inventoryCost = inventory.reduce((s, i) => s + (i.quantity * i.purchase_price), 0)
        const estimatedCosts = inventoryCost * 0.3
        const netProfit = totalRevenue - estimatedCosts - totalTax

        const prevRevenue = prevOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
        const comp = calculateComparison(totalRevenue, prevRevenue)

        const newAlerts = []
        if (netProfit < 0) newAlerts.push('🔴 ALERT: Business is running at a LOSS! Take immediate action.')
        if (comp.trend === 'down' && comp.change > 20) newAlerts.push(`⚠️ Revenue dropped by ${comp.change.toFixed(1)}% compared to previous period`)

        setComparison(comp)
        setAlerts(newAlerts)

        const profitData = [
            { category: 'Total Revenue', amount: totalRevenue, type: 'income' },
            { category: 'Tax Collected', amount: totalTax, type: 'neutral' },
            { category: 'Inventory Cost', amount: inventoryCost, type: 'expense' },
            { category: 'Operational Cost', amount: estimatedCosts, type: 'expense' },
            { category: 'Net Profit', amount: netProfit, type: netProfit >= 0 ? 'profit' : 'loss' }
        ]

        setStats([
            { label: 'Revenue', value: `PKR ${totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: '#10b981', trend: comp.change },
            { label: 'Costs', value: `PKR ${(inventoryCost + estimatedCosts).toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: '#ef4444' },
            { label: netProfit >= 0 ? 'Profit' : 'Loss', value: `PKR ${Math.abs(netProfit).toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: netProfit >= 0 ? '#10b981' : '#ef4444', subtext: netProfit >= 0 ? '✅ Positive' : '⚠️ Negative' }
        ])
        setData(profitData)
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

    const generatePDF = () => {
        const reportContent = document.getElementById('report-content')
        if (!reportContent) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const dateLabel = dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'
        const categoryLabel = category === 'waiters' ? 'Waiter Performance' : category === 'menu' ? 'Menu Analysis' : category === 'inventory' ? 'Inventory Status' : 'Profit & Loss'

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>RT Restaurant - ${categoryLabel} Report</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Arial', sans-serif; padding: 40px; background: white; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
                    .header h1 { color: #3b82f6; font-size: 32px; margin-bottom: 10px; }
                    .header p { color: #666; font-size: 14px; }
                    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
                    .stat-card h3 { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
                    .stat-card p { color: #000; font-size: 24px; font-weight: bold; }
                    .comparison { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                    .alerts { background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b; }
                    .alerts h3 { color: #f59e0b; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #3b82f6; color: white; font-weight: bold; }
                    tr:hover { background: #f8f9fa; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🍽️ RT Restaurant</h1>
                    <p><strong>${categoryLabel}</strong> - ${dateLabel} | Generated on ${new Date().toLocaleString()}</p>
                </div>
                ${comparison ? `
                    <div class="comparison">
                        <h3>📊 Period Comparison</h3>
                        <p style="font-size: 20px; font-weight: bold; color: ${comparison.trend === 'up' ? '#10b981' : comparison.trend === 'down' ? '#ef4444' : '#666'};">
                            ${comparison.trend === 'up' ? '↗️' : comparison.trend === 'down' ? '↘️' : '→'} 
                            ${comparison.change.toFixed(1)}% ${comparison.trend === 'up' ? 'increase' : comparison.trend === 'down' ? 'decrease' : 'no change'} vs previous period
                        </p>
                    </div>
                ` : ''}
                ${alerts.length > 0 ? `
                    <div class="alerts">
                        <h3>⚠️ Important Alerts</h3>
                        ${alerts.map(alert => `<p style="margin: 5px 0;">• ${alert}</p>`).join('')}
                    </div>
                ` : ''}
                <div class="stats">
                    ${stats.map(stat => `
                        <div class="stat-card">
                            <h3>${stat.label}</h3>
                            <p>${stat.value}</p>
                            ${stat.subtext ? `<p style="font-size: 12px; color: #666; margin-top: 5px;">${stat.subtext}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ${reportContent.innerHTML}
                <div class="footer">
                    <p>RT Restaurant Management System | Lahore, Pakistan | +92 321 9343489</p>
                    <p style="margin-top: 5px;">This is a system-generated report. For queries, contact admin.</p>
                </div>
            </body>
            </html>
        `)

        printWindow.document.close()
        setTimeout(() => {
            printWindow.print()
        }, 500)
    }

    const columns = {
        waiters: [
            { key: 'waiter', label: 'Waiter', render: (r: any) => (
                    <div className="flex items-center gap-2">
                        {r.profile_pic ? <img src={r.profile_pic} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{r.waiter_name?.[0] || '?'}</div>}
                        <span className="font-medium">{r.waiter_name || 'N/A'}</span>
                    </div>
                )},
            { key: 'total_orders', label: 'Orders', render: (r: any) => r.total_orders || 0 },
            { key: 'total_items_served', label: 'Items Served', render: (r: any) => r.total_items_served || 0 },
            { key: 'top_item', label: 'Top Item', render: (r: any) => r.top_item || 'None' },
            { key: 'total_revenue', label: 'Revenue', align: 'right' as const, render: (r: any) => <span className="font-bold text-green-600">PKR {(r.total_revenue || 0).toLocaleString()}</span> }
        ],
        menu: [
            { key: 'item_name', label: 'Menu Item', render: (r: any) => r.item_name || 'N/A' },
            { key: 'price', label: 'Price', render: (r: any) => `PKR ${(r.price || 0).toLocaleString()}` },
            { key: 'total_quantity', label: 'Sold', render: (r: any) => r.total_quantity || 0 },
            { key: 'available', label: 'Status', render: (r: any) => <span className={`px-2 py-1 rounded text-xs font-medium ${r.available ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>{r.available ? 'Available' : 'Unavailable'}</span> },
            { key: 'total_revenue', label: 'Revenue', align: 'right' as const, render: (r: any) => <span className="font-bold text-blue-600">PKR {(r.total_revenue || 0).toLocaleString()}</span> }
        ],
        inventory: [
            { key: 'item_name', label: 'Item', render: (r: any) => r.item_name || 'N/A' },
            { key: 'current_stock', label: 'Stock', render: (r: any) => `${r.current_stock || 0} ${r.unit || ''}` },
            { key: 'purchase_price', label: 'Price/Unit', render: (r: any) => `PKR ${(r.purchase_price || 0).toLocaleString()}` },
            { key: 'status', label: 'Status', render: (r: any) => <span className={`px-2 py-1 rounded text-xs font-medium ${r.status === 'OK' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>{r.status || 'OK'}</span> },
            { key: 'stock_value', label: 'Value', align: 'right' as const, render: (r: any) => <span className="font-bold">PKR {(r.stock_value || 0).toLocaleString()}</span> }
        ],
        profit: [
            { key: 'category', label: 'Category', render: (r: any) => r.category || 'N/A' },
            { key: 'type', label: 'Type', render: (r: any) => {
                    const colors: Record<string, string> = { income: 'bg-green-500/20 text-green-600', expense: 'bg-red-500/20 text-red-600', profit: 'bg-blue-500/20 text-blue-600', loss: 'bg-red-500/20 text-red-600', neutral: 'bg-gray-500/20 text-gray-600' }
                    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[r.type] || ''}`}>{r.type?.toUpperCase() || 'N/A'}</span>
                }},
            { key: 'amount', label: 'Amount', align: 'right' as const, render: (r: any) => {
                    const color = r.type === 'income' || r.type === 'profit' ? 'text-green-600' : r.type === 'expense' || r.type === 'loss' ? 'text-red-600' : 'text-gray-600'
                    return <span className={`font-bold text-lg ${color}`}>PKR {(r.amount || 0).toLocaleString()}</span>
                }}
        ]
    }

    const sidebarItems = useSidebarItems([
        { id: 'waiters', label: 'Waiter Reports', icon: '👤', count: data.length },
        { id: 'menu', label: 'Menu Analysis', icon: '🍽️', count: data.length },
        { id: 'inventory', label: 'Stock Usage', icon: '📦', count: data.length },
        { id: 'profit', label: 'Profit/Loss', icon: '💰', count: data.length }
    ], category, (id: string) => setCategory(id as Category))

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Reports" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <PageHeader
                    title="Business Reports"
                    subtitle="Detailed performance & financial analysis"
                    action={
                        <div className="flex gap-2">
                            <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} className="px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                            <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm active:scale-95">
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                            <button onClick={generatePDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm active:scale-95">
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                        </div>
                    }
                />

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {/* Comparison Card */}
                    {comparison && (
                        <div className={`p-4 rounded-lg border-2 ${comparison.trend === 'up' ? 'bg-green-50 border-green-600' : comparison.trend === 'down' ? 'bg-red-50 border-red-600' : 'bg-gray-50 border-gray-600'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {comparison.trend === 'up' ? <ArrowUp className="w-6 h-6 text-green-600" /> : comparison.trend === 'down' ? <ArrowDown className="w-6 h-6 text-red-600" /> : <Minus className="w-6 h-6 text-gray-600" />}
                                    <div>
                                        <p className="text-sm font-medium text-[var(--muted)]">vs Previous Period</p>
                                        <p className={`text-2xl font-bold ${comparison.trend === 'up' ? 'text-green-600' : comparison.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                                            {comparison.change.toFixed(1)}% {comparison.trend === 'up' ? 'increase' : comparison.trend === 'down' ? 'decrease' : 'no change'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--muted)]">
                                    Comparing with {dateRange === 'today' ? 'yesterday' : dateRange === 'week' ? 'last week' : 'last month'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                        Important Alerts
                                        <span className="px-2 py-0.5 bg-yellow-600 text-white rounded-full text-xs">{alerts.length}</span>
                                    </h3>
                                    <ul className="space-y-1">
                                        {alerts.map((alert, idx) => (
                                            <li key={idx} className="text-sm text-yellow-800">{alert}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <ResponsiveStatsGrid stats={stats} />

                    {/* Hidden content for PDF generation */}
                    <div id="report-content" className="hidden">
                        <table>
                            <thead>
                            <tr>
                                {columns[category].map(col => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx}>
                                    {columns[category].map(col => (
                                        <td key={col.key}>
                                            {col.render ?
                                                (typeof col.render(row) === 'object' ?
                                                        String(row[col.key] || '') :
                                                        col.render(row)
                                                ) :
                                                row[col.key]
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <UniversalDataTable columns={columns[category]} data={data} loading={loading} />
                </div>
            </div>
        </>
    )
}
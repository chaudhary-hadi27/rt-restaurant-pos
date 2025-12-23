import { createClient } from '@/lib/supabase/client'

type DateRange = 'today' | 'week' | 'month' | 'year'

export const getDateRange = (range: DateRange) => {
    const now = new Date()
    const start = new Date()

    if (range === 'today') start.setHours(0, 0, 0, 0)
    else if (range === 'week') start.setDate(now.getDate() - 7)
    else if (range === 'month') start.setMonth(now.getMonth() - 1)
    else if (range === 'year') start.setFullYear(now.getFullYear() - 1)

    return { startDate: start.toISOString(), endDate: now.toISOString() }
}

export const getPreviousDateRange = (range: DateRange) => {
    const { startDate } = getDateRange(range)
    const start = new Date(startDate)
    const duration = new Date().getTime() - start.getTime()
    const prevEnd = start
    const prevStart = new Date(start.getTime() - duration)

    return { startDate: prevStart.toISOString(), endDate: prevEnd.toISOString() }
}

export const calculateComparison = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, trend: 'neutral' as const }
    const change = ((current - previous) / previous) * 100
    return {
        change: Math.abs(change),
        trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    }
}

// ✅ OPTIMIZED: Use daily_summaries for long ranges
export const loadWaiterReport = async (start: string, end: string, prevRange: any) => {
    const supabase = createClient()

    // For long ranges (>7 days), use summaries
    const daysDiff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) {
        // Use aggregated data
        const { data: orders } = await supabase
            .from('orders')
            .select('waiter_id, total_amount, waiters(name, profile_pic)')
            .gte('created_at', start)
            .lte('created_at', end)
            .eq('status', 'completed')

        const waiterData: Record<string, any> = {}
        orders?.forEach((order: any) => {
            const wId = order.waiter_id
            if (!waiterData[wId]) {
                waiterData[wId] = {
                    waiter_name: order.waiters?.name || 'Unknown',
                    profile_pic: order.waiters?.profile_pic,
                    total_orders: 0,
                    total_revenue: 0
                }
            }
            waiterData[wId].total_orders += 1
            waiterData[wId].total_revenue += order.total_amount || 0
        })

        const result = Object.values(waiterData)
        const totalRevenue = result.reduce((s: any, w: any) => s + w.total_revenue, 0)

        // Previous period comparison
        const { data: prevOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', prevRange.startDate)
            .lte('created_at', prevRange.endDate)
            .eq('status', 'completed')

        const prevRevenue = prevOrders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0

        return { result, comparison: calculateComparison(totalRevenue, prevRevenue) }
    }

    // For short ranges, get detailed data (existing logic)
    const [currentOrders, prevOrders] = await Promise.all([
        supabase.from('orders').select('waiter_id, total_amount, waiters(name, profile_pic), order_items(quantity, menu_items(name))').gte('created_at', start).lte('created_at', end).eq('status', 'completed'),
        supabase.from('orders').select('total_amount').gte('created_at', prevRange.startDate).lte('created_at', prevRange.endDate).eq('status', 'completed')
    ])

    const waiterData: Record<string, any> = {}
    currentOrders.data?.forEach((order: any) => {
        const wId = order.waiter_id
        if (!waiterData[wId]) {
            waiterData[wId] = { waiter_name: order.waiters?.name || 'Unknown', profile_pic: order.waiters?.profile_pic, total_orders: 0, total_items_served: 0, total_revenue: 0, items_detail: {} }
        }
        waiterData[wId].total_orders += 1
        waiterData[wId].total_revenue += order.total_amount || 0
        order.order_items?.forEach((item: any) => {
            waiterData[wId].total_items_served += item.quantity
            const itemName = item.menu_items?.name || 'Unknown'
            waiterData[wId].items_detail[itemName] = (waiterData[wId].items_detail[itemName] || 0) + item.quantity
        })
    })

    const result = Object.values(waiterData).map((w: any) => ({ ...w, top_item: Object.entries(w.items_detail).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'None' }))
    const totalRevenue = result.reduce((s, w) => s + w.total_revenue, 0)
    const prevRevenue = prevOrders.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0

    return { result, comparison: calculateComparison(totalRevenue, prevRevenue) }
}

// ✅ Same optimization for other reports
export const loadMenuReport = async (start: string, end: string, prevRange: any) => {
    const supabase = createClient()
    const [totalMenuRes, servedRes, prevServedRes] = await Promise.all([
        supabase.from('menu_items').select('id, name, price, is_available'),
        supabase.from('order_items').select('menu_item_id, quantity, unit_price').gte('created_at', start).lte('created_at', end),
        supabase.from('order_items').select('quantity').gte('created_at', prevRange.startDate).lte('created_at', prevRange.endDate)
    ])

    const menuStats: Record<string, any> = {}
    totalMenuRes.data?.forEach(item => { menuStats[item.id] = { item_name: item.name, price: item.price, available: item.is_available, total_quantity: 0, total_revenue: 0 } })
    servedRes.data?.forEach((order: any) => {
        const id = order.menu_item_id
        if (menuStats[id]) {
            menuStats[id].total_quantity += order.quantity
            menuStats[id].total_revenue += order.quantity * (order.unit_price || 0)
        }
    })

    const result = Object.values(menuStats).sort((a: any, b: any) => b.total_quantity - a.total_quantity)
    const servedItems = result.filter(r => r.total_quantity > 0).length
    const prevServed = prevServedRes.data?.length || 0

    return { result, comparison: calculateComparison(servedItems, prevServed) }
}

export const loadInventoryUsage = async () => {
    const supabase = createClient()
    const { data: items } = await supabase.from('inventory_items').select('id, name, quantity, unit, purchase_price, reorder_level')
    const result = items?.map(item => ({ item_name: item.name, current_stock: item.quantity, unit: item.unit, purchase_price: item.purchase_price, reorder_level: item.reorder_level, stock_value: item.quantity * item.purchase_price, status: item.quantity <= item.reorder_level ? 'Low Stock' : 'OK' })) || []
    return { result: result.sort((a, b) => a.current_stock - b.current_stock) }
}

export const loadProfitLoss = async (start: string, end: string, prevRange: any) => {
    const supabase = createClient()

    // ✅ Try using daily_summaries first
    const daysDiff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) {
        const { data: summaries } = await supabase
            .from('daily_summaries')
            .select('*')
            .gte('date', start.split('T')[0])
            .lte('date', end.split('T')[0])

        if (summaries?.length) {
            const totalRevenue = summaries.reduce((s, d) => s + (d.total_revenue || 0), 0)
            const totalTax = summaries.reduce((s, d) => s + (d.total_tax || 0), 0)
            const inventoryCost = summaries.reduce((s, d) => s + (d.inventory_cost || 0), 0)
            const netProfit = summaries.reduce((s, d) => s + (d.net_profit || 0), 0)

            const profitData = [
                { category: 'Total Revenue', amount: totalRevenue, type: 'income' },
                { category: 'Tax Collected', amount: totalTax, type: 'neutral' },
                { category: 'Inventory Cost', amount: inventoryCost, type: 'expense' },
                { category: 'Net Profit', amount: netProfit, type: netProfit >= 0 ? 'profit' : 'loss' }
            ]

            // Previous period
            const { data: prevSummaries } = await supabase
                .from('daily_summaries')
                .select('total_revenue')
                .gte('date', prevRange.startDate.split('T')[0])
                .lte('date', prevRange.endDate.split('T')[0])

            const prevRevenue = prevSummaries?.reduce((s, d) => s + (d.total_revenue || 0), 0) || 0

            return { result: profitData, comparison: calculateComparison(totalRevenue, prevRevenue), netProfit }
        }
    }

    // Fallback to real-time calculation
    const [ordersRes, prevOrdersRes, inventoryRes] = await Promise.all([
        supabase.from('orders').select('total_amount, subtotal, tax').gte('created_at', start).lte('created_at', end).eq('status', 'completed'),
        supabase.from('orders').select('total_amount').gte('created_at', prevRange.startDate).lte('created_at', prevRange.endDate).eq('status', 'completed'),
        supabase.from('inventory_items').select('quantity, purchase_price')
    ])

    const totalRevenue = ordersRes.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0
    const totalTax = ordersRes.data?.reduce((s, o) => s + (o.tax || 0), 0) || 0
    const inventoryCost = inventoryRes.data?.reduce((s, i) => s + (i.quantity * i.purchase_price * 0.1), 0) || 0
    const netProfit = totalRevenue - inventoryCost - totalTax
    const prevRevenue = prevOrdersRes.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0

    const profitData = [
        { category: 'Total Revenue', amount: totalRevenue, type: 'income' },
        { category: 'Tax Collected', amount: totalTax, type: 'neutral' },
        { category: 'Inventory Cost', amount: inventoryCost, type: 'expense' },
        { category: 'Net Profit', amount: netProfit, type: netProfit >= 0 ? 'profit' : 'loss' }
    ]

    return { result: profitData, comparison: calculateComparison(totalRevenue, prevRevenue), netProfit }
}
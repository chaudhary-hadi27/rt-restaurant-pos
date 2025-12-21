import { createClient } from '@/lib/supabase/client'

type DateRange = 'today' | 'week' | 'month'

export const getDateRange = (range: DateRange) => {
    const now = new Date()
    const start = new Date()
    if (range === 'today') start.setHours(0, 0, 0, 0)
    else if (range === 'week') start.setDate(now.getDate() - 7)
    else start.setMonth(now.getMonth() - 1)
    return { startDate: start.toISOString(), endDate: now.toISOString() }
}

export const getPreviousDateRange = (range: DateRange) => {
    const now = new Date()
    const prevStart = new Date()
    const prevEnd = new Date()
    if (range === 'today') {
        prevStart.setDate(now.getDate() - 1)
        prevStart.setHours(0, 0, 0, 0)
        prevEnd.setDate(now.getDate() - 1)
        prevEnd.setHours(23, 59, 59, 999)
    } else if (range === 'week') {
        prevStart.setDate(now.getDate() - 14)
        prevEnd.setDate(now.getDate() - 7)
    } else {
        prevStart.setMonth(now.getMonth() - 2)
        prevEnd.setMonth(now.getMonth() - 1)
    }
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

export const loadWaiterReport = async (start: string, end: string, prevRange: any) => {
    const supabase = createClient()
    const [currentOrders, prevOrders] = await Promise.all([
        supabase.from('orders').select('waiter_id, total_amount, waiters(name, profile_pic), order_items(quantity, menu_items(name, price))').gte('created_at', start).lte('created_at', end).eq('status', 'completed'),
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

export const loadMenuReport = async (start: string, end: string, prevRange: any) => {
    const supabase = createClient()
    const [totalMenuRes, servedRes, prevServedRes] = await Promise.all([
        supabase.from('menu_items').select('id, name, price, is_available'),
        supabase.from('order_items').select('menu_item_id, quantity, unit_price, orders(created_at, status)').gte('orders.created_at', start).lte('orders.created_at', end).eq('orders.status', 'completed'),
        supabase.from('order_items').select('quantity, orders(created_at, status)').gte('orders.created_at', prevRange.startDate).lte('orders.created_at', prevRange.endDate).eq('orders.status', 'completed')
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
    const [ordersRes, prevOrdersRes, inventoryRes] = await Promise.all([
        supabase.from('orders').select('total_amount, subtotal, tax').gte('created_at', start).lte('created_at', end).eq('status', 'completed'),
        supabase.from('orders').select('total_amount').gte('created_at', prevRange.startDate).lte('created_at', prevRange.endDate).eq('status', 'completed'),
        supabase.from('inventory_items').select('quantity, purchase_price')
    ])

    const totalRevenue = ordersRes.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0
    const totalTax = ordersRes.data?.reduce((s, o) => s + (o.tax || 0), 0) || 0
    const inventoryCost = inventoryRes.data?.reduce((s, i) => s + (i.quantity * i.purchase_price), 0) || 0
    const estimatedCosts = inventoryCost * 0.3
    const netProfit = totalRevenue - estimatedCosts - totalTax
    const prevRevenue = prevOrdersRes.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0

    const profitData = [
        { category: 'Total Revenue', amount: totalRevenue, type: 'income' },
        { category: 'Tax Collected', amount: totalTax, type: 'neutral' },
        { category: 'Inventory Cost', amount: inventoryCost, type: 'expense' },
        { category: 'Operational Cost', amount: estimatedCosts, type: 'expense' },
        { category: 'Net Profit', amount: netProfit, type: netProfit >= 0 ? 'profit' : 'loss' }
    ]

    return { result: profitData, comparison: calculateComparison(totalRevenue, prevRevenue), netProfit }
}
// src/lib/hooks/useHistory.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type HistoryFilters = {
    entity?: string // 'orders', 'inventory_items', 'restaurant_tables', 'menu_items', 'waiters'
    entityId?: string
    action?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
}

export function useHistory(filters: HistoryFilters = {}) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, today: 0, week: 0 })
    const supabase = createClient()

    const load = async () => {
        setLoading(true)
        let query = supabase.from('audit_logs').select('*')

        if (filters.entity) query = query.eq('entity_type', filters.entity)
        if (filters.entityId) query = query.eq('entity_id', filters.entityId)
        if (filters.action) query = query.eq('action', filters.action)
        if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
        if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

        query = query.order('created_at', { ascending: false }).limit(filters.limit || 50)

        const { data: logs } = await query
        setData(logs || [])

        // Calculate stats
        const now = new Date()
        const today = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString()

        const { count: total } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true })
        const { count: todayCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', today)
        const { count: weekCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo)

        setStats({ total: total || 0, today: todayCount || 0, week: weekCount || 0 })
        setLoading(false)
    }

    useEffect(() => {
        load()

        // Realtime subscription
        const channel = supabase
            .channel('audit_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, load)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [JSON.stringify(filters)])

    return { data, loading, stats, refresh: load }
}

// Specialized hooks
export const useOrderHistory = (orderId?: string) =>
    useHistory({ entity: 'orders', entityId: orderId })

export const useInventoryHistory = (itemId?: string) =>
    useHistory({ entity: 'inventory_items', entityId: itemId })

export const useTableHistory = (tableId?: string) =>
    useHistory({ entity: 'restaurant_tables', entityId: tableId })

export const useRecentActivity = () =>
    useHistory({ limit: 20 })
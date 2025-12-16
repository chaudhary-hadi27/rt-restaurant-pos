// src/app/(public)/kitchen/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, ChefHat } from 'lucide-react'

export default function KitchenDisplay() {
    const [orders, setOrders] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        loadOrders()

        const channel = supabase
            .channel('kitchen_orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: 'status=in.(pending,preparing)'
            }, loadOrders)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const loadOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, restaurant_tables(table_number), order_items(*, menu_items(name))')
            .in('status', ['pending', 'preparing'])
            .order('created_at', { ascending: true })

        setOrders(data || [])
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('orders').update({ status }).eq('id', id)
        loadOrders()
    }

    const getTimeAgo = (created: string) => {
        const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000)
        return mins < 1 ? 'Just now' : `${mins}m ago`
    }

    const pending = orders.filter(o => o.status === 'pending')
    const preparing = orders.filter(o => o.status === 'preparing')

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg)' }}>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ChefHat className="w-8 h-8" style={{ color: '#3b82f6' }} />
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>Kitchen Display</h1>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            {pending.length} pending · {preparing.length} preparing
                        </p>
                    </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Pending Orders */}
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                        <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        Pending ({pending.length})
                    </h2>
                    <div className="space-y-4">
                        {pending.map(order => (
                            <div
                                key={order.id}
                                className="p-5 rounded-xl border-2 animate-pulse"
                                style={{
                                    backgroundColor: 'var(--card)',
                                    borderColor: '#f59e0b'
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                    <span className="text-4xl font-bold" style={{ color: 'var(--fg)' }}>
                      #{order.restaurant_tables?.table_number}
                    </span>
                                        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                                            {getTimeAgo(order.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateStatus(order.id, 'preparing')}
                                        className="px-6 py-3 rounded-lg font-bold text-lg transition-transform hover:scale-105"
                                        style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                                    >
                                        START
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                      <span className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                        {item.quantity}x
                      </span>
                                            <span className="flex-1 ml-4 text-lg font-medium" style={{ color: 'var(--fg)' }}>
                        {item.menu_items?.name}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {pending.length === 0 && (
                            <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--card)' }}>
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
                                <p style={{ color: 'var(--muted)' }}>No pending orders</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preparing Orders */}
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                        <ChefHat className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        Preparing ({preparing.length})
                    </h2>
                    <div className="space-y-4">
                        {preparing.map(order => (
                            <div
                                key={order.id}
                                className="p-5 rounded-xl border-2"
                                style={{
                                    backgroundColor: 'var(--card)',
                                    borderColor: '#3b82f6'
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                    <span className="text-4xl font-bold" style={{ color: 'var(--fg)' }}>
                      #{order.restaurant_tables?.table_number}
                    </span>
                                        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                                            {getTimeAgo(order.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateStatus(order.id, 'completed')}
                                        className="px-6 py-3 rounded-lg font-bold text-lg transition-transform hover:scale-105"
                                        style={{ backgroundColor: '#10b981', color: '#fff' }}
                                    >
                                        DONE
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                      <span className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                        {item.quantity}x
                      </span>
                                            <span className="flex-1 ml-4 text-lg font-medium" style={{ color: 'var(--fg)' }}>
                        {item.menu_items?.name}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {preparing.length === 0 && (
                            <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--card)' }}>
                                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
                                <p style={{ color: 'var(--muted)' }}>No orders in progress</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
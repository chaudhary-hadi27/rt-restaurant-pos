"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Package, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [filter, setFilter] = useState('all')
    const supabase = createClient()

    useEffect(() => {
        load()
        supabase.channel('ord').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load).subscribe()
    }, [])

    const load = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, restaurant_tables(table_number), waiters(name), order_items(*, menu_items(name, price))')
            .order('created_at', { ascending: false })
        setOrders(data || [])
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('orders').update({ status }).eq('id', id)
    }

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        completed: orders.filter(o => o.status === 'completed').length
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Orders</h1>
                    <p className="text-sm text-[var(--muted)]">{stats.pending} pending · {stats.preparing} preparing</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
                    { label: 'Preparing', value: stats.preparing, icon: Package, color: '#3b82f6' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#10b981' }
                ].map(s => {
                    const Icon = s.icon
                    return (
                        <div key={s.label} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                            <Icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
                            <p className="text-xs text-[var(--muted)]">{s.label}</p>
                            <p className="text-2xl font-bold text-[var(--fg)]">{s.value}</p>
                        </div>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['all', 'pending', 'preparing', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-[var(--card)] text-[var(--fg)] border border-[var(--border)]'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Orders */}
            <div className="space-y-3">
                {filtered.map(o => (
                    <div key={o.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-[var(--fg)]">Order #{o.id.slice(0, 8)}</h3>
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                                        o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                                            o.status === 'preparing' ? 'bg-blue-500/20 text-blue-600' :
                                                'bg-green-500/20 text-green-600'
                                    }`}>
                    {o.status}
                  </span>
                                </div>
                                <p className="text-xs text-[var(--muted)]">
                                    Table {o.restaurant_tables?.table_number} · {o.waiters?.name} · {new Date(o.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                            <p className="text-xl font-bold text-blue-600">PKR {o.total_amount}</p>
                        </div>

                        {/* Items */}
                        <div className="space-y-1 mb-3">
                            {o.order_items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm p-2 bg-[var(--bg)] rounded-lg">
                                    <span className="text-[var(--fg)]">{item.quantity}x {item.menu_items?.name}</span>
                                    <span className="text-[var(--muted)]">PKR {item.total_price}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        {o.status !== 'completed' && (
                            <div className="flex gap-2">
                                {o.status === 'pending' && (
                                    <Button onClick={() => updateStatus(o.id, 'preparing')} className="text-sm">Start Preparing</Button>
                                )}
                                {o.status === 'preparing' && (
                                    <Button onClick={() => updateStatus(o.id, 'completed')} className="text-sm">Mark Complete</Button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
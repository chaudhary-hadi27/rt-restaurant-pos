// src/app/users/orders/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        loadOrders();
        const channel = supabase.channel('orders_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        const { data } = await supabase.from('orders').select('*, restaurant_tables(table_number), waiters(name), order_items(*, menu_items(name, price))').order('created_at', { ascending: false });
        setOrders(data || []);
        setLoading(false);
    };

    const updateStatus = async (orderId: string, status: string) => {
        await supabase.from('orders').update({ status }).eq('id', orderId);
        loadOrders();
    };

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        total: orders.length
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Orders</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{stats.pending} pending · {stats.preparing} preparing</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Pending" value={stats.pending} icon={Clock} color="#f59e0b" />
                <StatCard label="Preparing" value={stats.preparing} icon={Package} color="var(--accent)" />
                <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="#10b981" />
                <StatCard label="Total Today" value={stats.total} icon={Package} color="var(--accent)" />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['all', 'pending', 'preparing', 'completed'].map(status => (
                    <button key={status} onClick={() => setFilter(status)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: filter === status ? 'var(--accent)' : 'var(--card)', color: filter === status ? '#fff' : 'var(--fg)', border: '1px solid var(--border)' }}>
                        {status}
                    </button>
                ))}
            </div>

            {/* Orders */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(order => (
                        <div key={order.id} className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Order #{order.order_number || order.id.slice(0, 8)}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                order.status === 'preparing' ? 'bg-blue-500/20 text-blue-500' :
                                                    order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                        'bg-gray-500/20 text-gray-500'
                                        }`}>
                      {order.status}
                    </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                                        <span>Table {order.restaurant_tables?.table_number}</span>
                                        <span>•</span>
                                        <span>Waiter: {order.waiters?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>PKR {order.total_amount.toFixed(2)}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{order.order_items?.length || 0} items</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-2 mb-4">
                                {order.order_items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-sm p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                        <span style={{ color: 'var(--fg)' }}>{item.quantity}x {item.menu_items?.name}</span>
                                        <span style={{ color: 'var(--muted)' }}>PKR {item.total_price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            {order.status !== 'completed' && (
                                <div className="flex gap-2">
                                    {order.status === 'pending' && (
                                        <button onClick={() => updateStatus(order.id, 'preparing')} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                                            Start Preparing
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button onClick={() => updateStatus(order.id, 'completed')} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#10b981', color: '#fff' }}>
                                            Mark Complete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" style={{ color }} />
                <div>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{value}</p>
                </div>
            </div>
        </div>
    );
}
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waiter } from '@/types';
import { Plus, Search, Users, DollarSign, Clock, TrendingUp, Power, PowerOff } from 'lucide-react';
import WaiterCard from '@/components/waiters/WaiterCard';
import WaiterDialog from '@/components/waiters/WaiterDialog';
import DeleteDialog from '@/components/waiters/DeleteDialog';
import ViewDialog from '@/components/waiters/ViewDialog';

export default function WaitersPage() {
    const [waiters, setWaiters] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_duty'>('all');
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'view' | null; waiter?: any }>({ type: null });

    const supabase = createClient();

    useEffect(() => {
        loadWaiters();

        // Real-time updates
        const channel = supabase
            .channel('waiters_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waiters' }, () => loadWaiters())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadWaiters = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('waiter_monthly_performance')
            .select('*')
            .order('total_revenue', { ascending: false });
        setWaiters(data || []);
        setLoading(false);
    };

    const handleClockToggle = async (waiter: any) => {
        const { data, error } = await supabase.rpc(
            waiter.is_on_duty ? 'clock_out_waiter' : 'clock_in_waiter',
            { p_waiter_id: waiter.id }
        );

        if (!error) loadWaiters();
    };

    const filtered = waiters.filter(w => {
        const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
            w.phone?.toLowerCase().includes(search.toLowerCase());

        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && w.is_active) ||
            (statusFilter === 'on_duty' && w.is_on_duty);

        return matchSearch && matchStatus;
    });

    const stats = {
        total: waiters.length,
        onDuty: waiters.filter(w => w.is_on_duty).length,
        revenue: waiters.reduce((s, w) => s + (w.total_revenue || 0), 0),
        orders: waiters.reduce((s, w) => s + (w.total_orders || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Waiters</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        {stats.onDuty} on duty · {stats.total} total staff
                    </p>
                </div>
                <button
                    onClick={() => setDialog({ type: 'add' })}
                    className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Waiter
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        <div>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Staff</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5" style={{ color: '#10b981' }} />
                        <div>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>On Duty</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{stats.onDuty}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5" style={{ color: '#10b981' }} />
                        <div>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Revenue (Month)</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>PKR {stats.revenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        <div>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Orders (Month)</p>
                            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{stats.orders}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                    <input
                        type="text"
                        placeholder="Search waiters..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none text-sm"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'on_duty'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: statusFilter === status ? 'var(--accent-subtle)' : 'var(--card)',
                                borderColor: statusFilter === status ? 'var(--accent)' : 'var(--border)',
                                color: statusFilter === status ? 'var(--accent)' : 'var(--fg)',
                                border: '1px solid'
                            }}
                        >
                            {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'On Duty'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Waiters Grid */}
            {loading ? (
                <div className="rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)' }}></div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading waiters...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
                        <p className="font-medium mb-1" style={{ color: 'var(--fg)' }}>No waiters found</p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            {search ? 'Try adjusting your search' : 'Add your first waiter to get started'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((waiter) => (
                        <WaiterCard
                            key={waiter.id}
                            waiter={waiter}
                            onView={() => setDialog({ type: 'view', waiter })}
                            onEdit={() => setDialog({ type: 'edit', waiter })}
                            onDelete={() => setDialog({ type: 'delete', waiter })}
                            onClockToggle={() => handleClockToggle(waiter)}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            {(dialog.type === 'add' || dialog.type === 'edit') && (
                <WaiterDialog
                    waiter={dialog.waiter}
                    onClose={() => setDialog({ type: null })}
                    onSuccess={() => { setDialog({ type: null }); loadWaiters(); }}
                />
            )}
            {dialog.type === 'delete' && dialog.waiter && (
                <DeleteDialog
                    waiter={dialog.waiter}
                    onClose={() => setDialog({ type: null })}
                    onSuccess={() => { setDialog({ type: null }); loadWaiters(); }}
                />
            )}
            {dialog.type === 'view' && dialog.waiter && (
                <ViewDialog waiter={dialog.waiter} onClose={() => setDialog({ type: null })} />
            )}
        </div>
    );
}
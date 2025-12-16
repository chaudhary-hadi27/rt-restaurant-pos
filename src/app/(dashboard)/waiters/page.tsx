"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waiter } from '@/types';
import { Plus, Search, Users, DollarSign, Package } from 'lucide-react';
import WaiterCard from '@/components/waiters/WaiterCard';
import WaiterDialog from '@/components/waiters/WaiterDialog';
import DeleteDialog from '@/components/waiters/DeleteDialog';
import ViewDialog from '@/components/waiters/ViewDialog';

export default function WaitersPage() {
    const [waiters, setWaiters] = useState<Waiter[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editWaiter, setEditWaiter] = useState<Waiter | null>(null);
    const [deleteWaiter, setDeleteWaiter] = useState<Waiter | null>(null);
    const [viewWaiter, setViewWaiter] = useState<Waiter | null>(null);

    const supabase = createClient();

    useEffect(() => {
        loadWaiters();
    }, []);

    const loadWaiters = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('waiters')
            .select('*')
            .order('created_at', { ascending: false });
        setWaiters(data || []);
        setLoading(false);
    };

    const filtered = waiters.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.phone?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: waiters.length,
        active: waiters.filter(w => w.is_active).length,
        revenue: waiters.reduce((sum, w) => sum + w.total_revenue, 0),
        orders: waiters.reduce((sum, w) => sum + w.total_orders, 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>Waiters</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Manage restaurant staff</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Waiter
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: Users, color: 'var(--primary)' },
                    { label: 'Active', value: stats.active, icon: Users, color: '#22c55e' },
                    { label: 'Revenue', value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, color: '#3b82f6' },
                    { label: 'Orders', value: stats.orders, icon: Package, color: '#f59e0b' }
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                                <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--muted)' }} />
                <input
                    type="text"
                    placeholder="Search waiters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                />
            </div>

            {/* Waiters Grid */}
            {loading ? (
                <div className="text-center py-12" style={{ color: 'var(--muted)' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
                    {search ? 'No waiters found' : 'No waiters added yet'}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filtered.map((waiter) => (
                        <WaiterCard
                            key={waiter.id}
                            waiter={waiter}
                            onView={() => setViewWaiter(waiter)}
                            onEdit={() => setEditWaiter(waiter)}
                            onDelete={() => setDeleteWaiter(waiter)}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            {(showAdd || editWaiter) && (
                <WaiterDialog
                    waiter={editWaiter}
                    onClose={() => { setShowAdd(false); setEditWaiter(null); }}
                    onSuccess={() => { setShowAdd(false); setEditWaiter(null); loadWaiters(); }}
                />
            )}
            {deleteWaiter && (
                <DeleteDialog
                    waiter={deleteWaiter}
                    onClose={() => setDeleteWaiter(null)}
                    onSuccess={() => { setDeleteWaiter(null); loadWaiters(); }}
                />
            )}
            {viewWaiter && <ViewDialog waiter={viewWaiter} onClose={() => setViewWaiter(null)} />}
        </div>
    );
}
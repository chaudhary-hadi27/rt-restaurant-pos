"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, LayoutGrid, Users, CheckCircle, XCircle } from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

interface Table {
    id: string;
    table_number: number;
    capacity: number;
    status: TableStatus;
    section: string;
    waiter_name?: string;
    waiter_pic?: string;
    waiter_phone?: string;
    assigned_at?: string;
}

export default function TablesPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [waiters, setWaiters] = useState<any[]>([]);
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [assignDialog, setAssignDialog] = useState<{ table: Table | null }>({ table: null });

    const supabase = createClient();

    useEffect(() => {
        loadTables();
        loadWaiters();

        // Real-time updates
        const channel = supabase
            .channel('tables_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, () => loadTables())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_table_assignments' }, () => loadTables())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadTables = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('tables_with_waiter_info')
            .select('*')
            .order('table_number');
        setTables(data || []);
        setLoading(false);
    };

    const loadWaiters = async () => {
        const { data } = await supabase
            .from('waiters')
            .select('id, name, profile_pic, is_on_duty, is_active')
            .eq('is_active', true)
            .eq('is_on_duty', true);
        setWaiters(data || []);
    };

    const handleAssignWaiter = async (tableId: string, waiterId: string) => {
        const { error } = await supabase.rpc('assign_waiter_to_table', {
            p_waiter_id: waiterId,
            p_table_id: tableId
        });

        if (!error) {
            loadTables();
            setAssignDialog({ table: null });
        }
    };

    const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
        await supabase
            .from('restaurant_tables')
            .update({ status: newStatus })
            .eq('id', tableId);
        loadTables();
    };

    const sections = ['Indoor', 'Outdoor', 'VIP'];
    const statuses: TableStatus[] = ['available', 'occupied', 'reserved', 'cleaning'];

    const filtered = tables.filter(t => {
        const matchSection = sectionFilter === 'all' || t.section === sectionFilter;
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSection && matchStatus;
    });

    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied: tables.filter(t => t.status === 'occupied').length,
        withWaiter: tables.filter(t => t.waiter_name).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Tables</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        {stats.available} available · {stats.occupied} occupied · {stats.withWaiter} with waiter
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Tables" value={stats.total} icon={LayoutGrid} color="var(--accent)" />
                <StatCard label="Available" value={stats.available} icon={CheckCircle} color="#10b981" />
                <StatCard label="Occupied" value={stats.occupied} icon={XCircle} color="#ef4444" />
                <StatCard label="With Waiter" value={stats.withWaiter} icon={Users} color="var(--accent)" />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                {/* Section Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSectionFilter('all')}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: sectionFilter === 'all' ? 'var(--accent-subtle)' : 'var(--card)',
                            borderColor: sectionFilter === 'all' ? 'var(--accent)' : 'var(--border)',
                            color: sectionFilter === 'all' ? 'var(--accent)' : 'var(--fg)',
                            border: '1px solid'
                        }}
                    >
                        All Sections
                    </button>
                    {sections.map(section => (
                        <button
                            key={section}
                            onClick={() => setSectionFilter(section)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: sectionFilter === section ? 'var(--accent-subtle)' : 'var(--card)',
                                borderColor: sectionFilter === section ? 'var(--accent)' : 'var(--border)',
                                color: sectionFilter === section ? 'var(--accent)' : 'var(--fg)',
                                border: '1px solid'
                            }}
                        >
                            {section}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: statusFilter === 'all' ? 'var(--accent-subtle)' : 'var(--card)',
                            borderColor: statusFilter === 'all' ? 'var(--accent)' : 'var(--border)',
                            color: statusFilter === 'all' ? 'var(--accent)' : 'var(--fg)',
                            border: '1px solid'
                        }}
                    >
                        All Status
                    </button>
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize"
                            style={{
                                backgroundColor: statusFilter === status ? 'var(--accent-subtle)' : 'var(--card)',
                                borderColor: statusFilter === status ? 'var(--accent)' : 'var(--border)',
                                color: statusFilter === status ? 'var(--accent)' : 'var(--fg)',
                                border: '1px solid'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tables Grid */}
            {loading ? (
                <div className="rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)' }}></div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading tables...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(table => (
                        <TableCard
                            key={table.id}
                            table={table}
                            onAssignWaiter={() => setAssignDialog({ table })}
                            onStatusChange={(status) => handleStatusChange(table.id, status)}
                        />
                    ))}
                </div>
            )}

            {/* Assign Waiter Dialog */}
            {assignDialog.table && (
                <AssignWaiterDialog
                    table={assignDialog.table}
                    waiters={waiters}
                    onClose={() => setAssignDialog({ table: null })}
                    onAssign={handleAssignWaiter}
                />
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

function TableCard({ table, onAssignWaiter, onStatusChange }: any) {
    const statusColors = {
        available: '#10b981',
        occupied: '#ef4444',
        reserved: '#f59e0b',
        cleaning: 'var(--accent)'
    };

    return (
        <div className="p-5 rounded-xl border transition-all" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            {/* Table Number */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                         style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        {table.table_number}
                    </div>
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>Table {table.table_number}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{table.capacity} seats</p>
                    </div>
                </div>
                <span className="px-2 py-1 rounded-md text-xs font-medium capitalize"
                      style={{ backgroundColor: `${statusColors[table.status]}20`, color: statusColors[table.status] }}>
                    {table.status}
                </span>
            </div>

            {/* Section */}
            <div className="mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Section</p>
                <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{table.section}</p>
            </div>

            {/* Waiter Info */}
            {table.waiter_name ? (
                <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="flex items-center gap-2">
                        {table.waiter_pic ? (
                            <img src={table.waiter_pic} alt={table.waiter_name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs"
                                 style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                                {table.waiter_name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{table.waiter_name}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Assigned Waiter</p>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={onAssignWaiter}
                    className="w-full mb-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
                >
                    Assign Waiter
                </button>
            )}

            {/* Status Change */}
            <select
                value={table.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-xs font-medium capitalize"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
            </select>
        </div>
    );
}

function AssignWaiterDialog({ table, waiters, onClose, onAssign }: any) {
    const [selected, setSelected] = useState('');

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                        Assign Waiter to Table {table.table_number}
                    </h3>
                </div>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {waiters.length === 0 ? (
                        <p className="text-center py-8" style={{ color: 'var(--muted)' }}>
                            No waiters on duty. Please clock in a waiter first.
                        </p>
                    ) : (
                        waiters.map((waiter: any) => (
                            <button
                                key={waiter.id}
                                onClick={() => setSelected(waiter.id)}
                                className="w-full p-4 rounded-lg border flex items-center gap-3 transition-all"
                                style={{
                                    backgroundColor: selected === waiter.id ? 'var(--accent-subtle)' : 'var(--hover-bg)',
                                    borderColor: selected === waiter.id ? 'var(--accent)' : 'var(--border)'
                                }}
                            >
                                {waiter.profile_pic ? (
                                    <img src={waiter.profile_pic} alt={waiter.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                                         style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                                        {waiter.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-sm" style={{ color: 'var(--fg)' }}>{waiter.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>On Duty</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-sm"
                        style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selected && onAssign(table.id, selected)}
                        disabled={!selected}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        Assign
                    </button>
                </div>
            </div>
        </div>
    );
}
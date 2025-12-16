"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutGrid } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function TablesPage() {
    const [tables, setTables] = useState<any[]>([])
    const [waiters, setWaiters] = useState<any[]>([])
    const [assignModal, setAssignModal] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        load()
        supabase.channel('tbl').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, load).subscribe()
    }, [])

    const load = async () => {
        const [t, w] = await Promise.all([
            supabase.from('restaurant_tables').select('*').order('table_number'),
            supabase.from('waiters').select('*').eq('is_active', true).eq('is_on_duty', true)
        ])
        setTables(t.data || [])
        setWaiters(w.data || [])
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('restaurant_tables').update({ status }).eq('id', id)
    }

    const assignWaiter = async (tId: string, wId: string) => {
        await supabase.rpc('assign_waiter_to_table', { p_waiter_id: wId, p_table_id: tId })
        setAssignModal(null)
    }

    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied: tables.filter(t => t.status === 'occupied').length
    }

    const statusColors: any = {
        available: '#10b981',
        occupied: '#ef4444',
        reserved: '#f59e0b',
        cleaning: '#3b82f6'
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Tables</h1>
                    <p className="text-sm text-[var(--muted)]">{stats.available} available · {stats.occupied} occupied</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tables.map(t => (
                    <div key={t.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                                {t.table_number}
                            </div>
                            <span className="px-2 py-1 rounded-md text-xs font-medium capitalize" style={{ backgroundColor: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                {t.status}
              </span>
                        </div>

                        <p className="text-xs text-[var(--muted)] mb-3">{t.capacity} seats · {t.section}</p>

                        <select
                            value={t.status}
                            onChange={e => updateStatus(t.id, e.target.value)}
                            className="w-full px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--fg)] mb-2"
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                            <option value="cleaning">Cleaning</option>
                        </select>

                        <Button variant="secondary" onClick={() => setAssignModal(t)} className="w-full text-xs">
                            Assign Waiter
                        </Button>
                    </div>
                ))}
            </div>

            {/* Assign Modal */}
            {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAssignModal(null)}>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[var(--border)]">
                            <h3 className="font-semibold text-[var(--fg)]">Assign Waiter to Table {assignModal.table_number}</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {waiters.length === 0 ? (
                                <p className="text-center text-[var(--muted)] py-8">No waiters on duty</p>
                            ) : (
                                waiters.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => assignWaiter(assignModal.id, w.id)}
                                        className="w-full p-3 bg-[var(--bg)] hover:bg-blue-600/10 border border-[var(--border)] rounded-lg flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                                            {w.name[0]}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-[var(--fg)]">{w.name}</p>
                                            <p className="text-xs text-[var(--muted)]">{w.phone}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-[var(--border)]">
                            <Button variant="secondary" onClick={() => setAssignModal(null)} className="w-full">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
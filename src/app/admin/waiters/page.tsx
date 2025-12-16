"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Users, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function WaitersPage() {
    const [waiters, setWaiters] = useState<any[]>([])
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ name: '', phone: '' })
    const supabase = createClient()

    useEffect(() => {
        load()
        supabase.channel('wait').on('postgres_changes', { event: '*', schema: 'public', table: 'waiters' }, load).subscribe()
    }, [])

    const load = async () => {
        const { data } = await supabase.from('waiters').select('*').order('created_at', { ascending: false })
        setWaiters(data || [])
    }

    const save = async () => {
        const data = { name: form.name, phone: form.phone, is_active: true, total_orders: 0, total_revenue: 0 }

        if (modal?.id) {
            await supabase.from('waiters').update(data).eq('id', modal.id)
        } else {
            await supabase.from('waiters').insert(data)
        }

        setModal(null)
        setForm({ name: '', phone: '' })
    }

    const toggleDuty = async (w: any) => {
        await supabase.rpc(w.is_on_duty ? 'clock_out_waiter' : 'clock_in_waiter', { p_waiter_id: w.id })
    }

    const stats = { total: waiters.length, onDuty: waiters.filter(w => w.is_on_duty).length }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Waiters</h1>
                    <p className="text-sm text-[var(--muted)]">{stats.onDuty} on duty · {stats.total} total</p>
                </div>
                <Button onClick={() => { setModal({}); setForm({ name: '', phone: '' }) }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Waiter
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waiters.map(w => (
                    <div key={w.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                                {w.name[0]}
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--fg)]">{w.name}</h3>
                                <p className="text-xs text-[var(--muted)]">{w.phone}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 bg-[var(--bg)] rounded-lg">
                                <p className="text-xs text-[var(--muted)]">Orders</p>
                                <p className="font-bold text-[var(--fg)]">{w.total_orders}</p>
                            </div>
                            <div className="p-2 bg-[var(--bg)] rounded-lg">
                                <p className="text-xs text-[var(--muted)]">Revenue</p>
                                <p className="font-bold text-[var(--fg)]">PKR {w.total_revenue}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => toggleDuty(w)}
                                className="flex-1 text-xs"
                            >
                                <Clock className="w-3 h-3 mr-1" />
                                {w.is_on_duty ? 'Clock Out' : 'Clock In'}
                            </Button>
                            <button
                                onClick={() => { setModal(w); setForm({ name: w.name, phone: w.phone }) }}
                                className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Waiter' : 'Add Waiter'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
                        <Button onClick={save} className="flex-1">Save</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input label="Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Phone" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
                </div>
            </Modal>
        </div>
    )
}
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Package } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ name: '', quantity: '', unit: 'kg', price: '' })
    const supabase = createClient()

    useEffect(() => {
        load()
        supabase.channel('inv').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, load).subscribe()
    }, [])

    const load = async () => {
        const { data } = await supabase.from('inventory_items').select('*').eq('is_active', true)
        setItems(data || [])
    }

    const save = async () => {
        const data = { name: form.name, quantity: +form.quantity, unit: form.unit, purchase_price: +form.price, reorder_level: 10 }

        if (modal?.id) {
            await supabase.from('inventory_items').update(data).eq('id', modal.id)
        } else {
            await supabase.from('inventory_items').insert(data)
        }

        setModal(null)
        setForm({ name: '', quantity: '', unit: 'kg', price: '' })
    }

    const del = async (id: string) => {
        if (confirm('Delete this item?')) {
            await supabase.from('inventory_items').delete().eq('id', id)
        }
    }

    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    const stats = { total: items.length, value: items.reduce((s, i) => s + (i.quantity * i.purchase_price), 0) }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Inventory</h1>
                    <p className="text-sm text-[var(--muted)]">{stats.total} items · PKR {stats.value.toLocaleString()}</p>
                </div>
                <Button onClick={() => { setModal({}); setForm({ name: '', quantity: '', unit: 'kg', price: '' }) }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
            </div>

            {/* Items */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                    <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)]">ITEM</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)]">QTY</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)]">PRICE</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)]">VALUE</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)]">ACTIONS</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-12">
                                <Package className="w-12 h-12 mx-auto mb-2 text-[var(--muted)] opacity-20" />
                                <p className="text-[var(--muted)]">No items found</p>
                            </td>
                        </tr>
                    ) : (
                        filtered.map(i => (
                            <tr key={i.id} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                                <td className="px-4 py-3 font-medium text-[var(--fg)]">{i.name}</td>
                                <td className="px-4 py-3 text-right text-[var(--fg)]">{i.quantity} {i.unit}</td>
                                <td className="px-4 py-3 text-right text-[var(--fg)]">PKR {i.purchase_price}</td>
                                <td className="px-4 py-3 text-right font-semibold text-[var(--fg)]">PKR {(i.quantity * i.purchase_price).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => { setModal(i); setForm({ name: i.name, quantity: i.quantity, unit: i.unit, price: i.purchase_price }) }} className="text-blue-600 hover:text-blue-700 text-sm mr-3">Edit</button>
                                    <button onClick={() => del(i.id)} className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Item' : 'Add Item'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
                        <Button onClick={save} className="flex-1">Save</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input label="Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Quantity" type="number" value={form.quantity} onChange={(e: any) => setForm({ ...form, quantity: e.target.value })} />
                        <Input label="Unit" value={form.unit} onChange={(e: any) => setForm({ ...form, unit: e.target.value })} />
                    </div>
                    <Input label="Price (PKR)" type="number" value={form.price} onChange={(e: any) => setForm({ ...form, price: e.target.value })} />
                </div>
            </Modal>
        </div>
    )
}
"use client"

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminTablesPage() {
    const { data: tables, loading, insert, update, remove } = useSupabase('restaurant_tables', {
        order: { column: 'table_number' },
        realtime: true
    })

    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({
        table_number: '',
        capacity: '',
        section: '',
        status: 'available'
    })

    const filtered = tables.filter((t: any) =>
        t.table_number.toString().includes(search) ||
        t.section?.toLowerCase().includes(search.toLowerCase())
    )

    const openModal = (table?: any) => {
        if (table) {
            setForm({
                table_number: table.table_number.toString(),
                capacity: table.capacity.toString(),
                section: table.section || '',
                status: table.status
            })
        } else {
            setForm({ table_number: '', capacity: '', section: '', status: 'available' })
        }
        setModal(table || {})
    }

    const save = async () => {
        if (!form.table_number || !form.capacity) {
            alert('Table number and capacity required')
            return
        }

        const data = {
            table_number: parseInt(form.table_number),
            capacity: parseInt(form.capacity),
            section: form.section || null,
            status: form.status
        }

        try {
            if (modal?.id) {
                const { error } = await update(modal.id, data)
                if (error) throw error
            } else {
                const { error } = await insert(data)
                if (error) throw error
            }
            alert('✅ Table saved!')
            setModal(null)
        } catch (error) {
            console.error('Save error:', error)
            alert('❌ Failed to save table')
        }
    }

    const deleteTable = async (id: string) => {
        if (confirm('Delete this table?')) {
            try {
                const { error } = await remove(id)
                if (error) throw error
                alert('✅ Table deleted!')
            } catch (error) {
                console.error('Delete error:', error)
                alert('❌ Failed to delete')
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Tables</h1>
                    <p className="text-sm text-[var(--muted)]">{tables.length} tables</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="w-4 h-4 mr-2" /> Add Table
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tables..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((table: any) => (
                        <div key={table.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-2xl font-bold text-[var(--fg)]">#{table.table_number}</div>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    table.status === 'available' ? 'bg-green-500/20 text-green-600' :
                                        table.status === 'occupied' ? 'bg-red-500/20 text-red-600' :
                                            table.status === 'reserved' ? 'bg-yellow-500/20 text-yellow-600' :
                                                'bg-blue-500/20 text-blue-600'
                                }`}>
                                    {table.status}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--muted)] mb-3">
                                {table.capacity} seats · {table.section || 'Main'}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(table)} className="text-blue-600 text-sm">Edit</button>
                                <button onClick={() => deleteTable(table.id)} className="text-red-600 text-sm">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Table' : 'Add Table'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
                        <Button onClick={save} className="flex-1">Save</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input
                        label="Table Number"
                        type="number"
                        value={form.table_number}
                        onChange={(e: any) => setForm({ ...form, table_number: e.target.value })}
                    />
                    <Input
                        label="Capacity (seats)"
                        type="number"
                        value={form.capacity}
                        onChange={(e: any) => setForm({ ...form, capacity: e.target.value })}
                    />
                    <Input
                        label="Section"
                        value={form.section}
                        onChange={(e: any) => setForm({ ...form, section: e.target.value })}
                        placeholder="e.g., Main, Outdoor, VIP"
                    />
                    <div>
                        <label className="block text-sm font-medium text-[var(--fg)] mb-2">Status</label>
                        <select
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                            <option value="cleaning">Cleaning</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

// src/app/admin/tables/page.tsx
"use client"

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus, Search } from 'lucide-react'
import NestedSidebar from '@/components/layout/NestedSidebar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function AdminTablesPage() {
    const { data: tables, loading, insert, update, remove } = useSupabase('restaurant_tables', {
        order: { column: 'table_number' },
        realtime: true
    })

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({
        table_number: '',
        capacity: '',
        section: '',
        status: 'available'
    })
    const toast = useToast()

    const filtered = tables.filter((t: any) => {
        const matchSearch = t.table_number.toString().includes(search) ||
            t.section?.toLowerCase().includes(search.toLowerCase())
        if (statusFilter === 'all') return matchSearch
        return matchSearch && t.status === statusFilter
    })

    const stats = {
        total: tables.length,
        available: tables.filter((t: any) => t.status === 'available').length,
        occupied: tables.filter((t: any) => t.status === 'occupied').length,
        reserved: tables.filter((t: any) => t.status === 'reserved').length,
        cleaning: tables.filter((t: any) => t.status === 'cleaning').length
    }

    // Get unique sections
    const sections = Array.from(new Set(tables.map((t: any) => t.section).filter(Boolean)))

    // Nested Sidebar Items
    const sidebarItems = [
        {
            id: 'all',
            label: 'All Tables',
            icon: '🏠',
            count: stats.total,
            active: statusFilter === 'all',
            onClick: () => setStatusFilter('all')
        },
        {
            id: 'available',
            label: 'Available',
            icon: '🟢',
            count: stats.available,
            active: statusFilter === 'available',
            onClick: () => setStatusFilter('available')
        },
        {
            id: 'occupied',
            label: 'Occupied',
            icon: '🔴',
            count: stats.occupied,
            active: statusFilter === 'occupied',
            onClick: () => setStatusFilter('occupied')
        },
        {
            id: 'reserved',
            label: 'Reserved',
            icon: '🟡',
            count: stats.reserved,
            active: statusFilter === 'reserved',
            onClick: () => setStatusFilter('reserved')
        },
        {
            id: 'cleaning',
            label: 'Cleaning',
            icon: '🧹',
            count: stats.cleaning,
            active: statusFilter === 'cleaning',
            onClick: () => setStatusFilter('cleaning')
        }
    ]

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
            toast.add('error', 'Table number and capacity required')
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
                toast.add('success', '✅ Table updated!')
            } else {
                const { error } = await insert(data)
                if (error) throw error
                toast.add('success', '✅ Table added!')
            }
            setModal(null)
        } catch (error) {
            console.error('Save error:', error)
            toast.add('error', '❌ Failed to save table')
        }
    }

    const deleteTable = async (id: string) => {
        if (confirm('Delete this table?')) {
            try {
                const { error } = await remove(id)
                if (error) throw error
                toast.add('success', '✅ Table deleted!')
            } catch (error) {
                console.error('Delete error:', error)
                toast.add('error', '❌ Failed to delete')
            }
        }
    }

    const getStatusColor = (status: string) => {
        const colors = {
            available: '#10b981',
            occupied: '#ef4444',
            reserved: '#f59e0b',
            cleaning: '#3b82f6'
        }
        return colors[status as keyof typeof colors] || '#6b7280'
    }

    return (
        <>
            <NestedSidebar title="Table Status" items={sidebarItems} />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--fg)]">Tables Management</h1>
                                <p className="text-sm text-[var(--muted)] mt-1">{filtered.length} tables</p>
                            </div>
                            <Button onClick={() => openModal()}>
                                <Plus className="w-4 h-4 mr-2" /> Add Table
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                                <div key={table.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:shadow-lg transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                                            style={{ backgroundColor: getStatusColor(table.status) }}
                                        >
                                            {table.table_number}
                                        </div>
                                        <span
                                            className="px-2 py-1 rounded-md text-xs font-medium capitalize"
                                            style={{ backgroundColor: `${getStatusColor(table.status)}20`, color: getStatusColor(table.status) }}
                                        >
                                            {table.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--muted)] mb-3">
                                        {table.capacity} seats · {table.section || 'Main'}
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(table)} className="flex-1 text-blue-600 text-sm font-medium">Edit</button>
                                        <button onClick={() => deleteTable(table.id)} className="flex-1 text-red-600 text-sm font-medium">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                        label="Table Number *"
                        type="number"
                        value={form.table_number}
                        onChange={(e: any) => setForm({ ...form, table_number: e.target.value })}
                    />
                    <Input
                        label="Capacity (seats) *"
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
        </>
    )
}
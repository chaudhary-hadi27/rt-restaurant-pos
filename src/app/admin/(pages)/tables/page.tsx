"use client"

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { FormModal } from '@/components/ui/UniversalModal'
import ResponsiveInput, { FormGrid } from '@/components/ui/ResponsiveInput'
import { useToast } from '@/components/ui/Toast'

export default function AdminTablesPage() {
    const { data: tables, loading, insert, update, remove } = useSupabase('restaurant_tables', { order: { column: 'table_number' }, realtime: true })
    const [sectionFilter, setSectionFilter] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ table_number: '', capacity: '', section: '' })
    const toast = useToast()

    const sections = Array.from(new Set(tables.map((t: any) => t.section).filter(Boolean)))
    const filtered = tables.filter((t: any) => sectionFilter === 'all' || t.section === sectionFilter)

    const getStatusColor = (status: string) => ({ available: '#10b981', occupied: '#ef4444', reserved: '#f59e0b', cleaning: '#3b82f6' }[status] || '#6b7280')

    const stats = [
        { label: 'Total', value: tables.length, color: '#3b82f6', onClick: () => setSectionFilter('all'), active: sectionFilter === 'all', subtext: `${sections.length} sections` },
        ...sections.map(section => ({ label: section as string, value: tables.filter((t: any) => t.section === section).length, color: '#10b981', onClick: () => setSectionFilter(section as string), active: sectionFilter === section }))
    ]

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Tables', icon: '🏠', count: tables.length },
        ...sections.map(section => ({ id: section as string, label: section as string, icon: '📍', count: tables.filter((t: any) => t.section === section).length }))
    ], sectionFilter, setSectionFilter)

    const openModal = (table?: any) => {
        if (table) {
            setForm({ table_number: table.table_number.toString(), capacity: table.capacity.toString(), section: table.section || '' })
        } else {
            setForm({ table_number: '', capacity: '', section: '' })
        }
        setModal(table || {})
    }

    const save = async () => {
        if (!form.table_number || !form.capacity) return toast.add('error', 'Table number and capacity required')

        if (!modal?.id) {
            const duplicate = tables.find((t: any) => t.table_number === parseInt(form.table_number))
            if (duplicate) return toast.add('error', `❌ Table ${form.table_number} already exists!`)
        }

        if (modal?.id) {
            const duplicate = tables.find((t: any) => t.table_number === parseInt(form.table_number) && t.id !== modal.id)
            if (duplicate) return toast.add('error', `❌ Table number ${form.table_number} is already used!`)
        }

        const data = { table_number: parseInt(form.table_number), capacity: parseInt(form.capacity), section: form.section || 'Main' }

        try {
            if (modal?.id) {
                const { error } = await update(modal.id, data)
                if (error) throw error
                toast.add('success', '✅ Table updated!')
            } else {
                const { error } = await insert({ ...data, status: 'available' })
                if (error) throw error
                toast.add('success', `✅ Table ${form.table_number} added!`)
            }
            setModal(null)
            setForm({ table_number: '', capacity: '', section: '' })
        } catch (error: any) {
            if (error?.code === '23505') toast.add('error', `❌ Table ${form.table_number} already exists!`)
            else toast.add('error', `❌ ${error.message || 'Failed to save'}`)
        }
    }

    const deleteTable = async (id: string) => {
        const table = tables.find((t: any) => t.id === id)
        if (table?.status === 'occupied' || table?.status === 'reserved') return toast.add('error', '❌ Cannot delete occupied/reserved tables')
        if (confirm('Delete this table?')) {
            try {
                const { error } = await remove(id)
                if (error) throw error
                toast.add('success', '✅ Table deleted!')
            } catch (error) {
                toast.add('error', '❌ Failed to delete')
            }
        }
    }

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Sections" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--fg)] truncate">Tables Setup</h1>
                                <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{filtered.length} tables • {sections.length} sections</p>   </div>
                            <button onClick={() => openModal()} className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium flex-shrink-0 text-sm active:scale-95">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    <ResponsiveStatsGrid stats={stats} />

                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">ℹ️ <strong>Admin:</strong> You manage table details. Status is auto-updated by staff.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 sm:p-12 text-center">
                            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🪑</div>
                            <p className="text-[var(--fg)] font-medium mb-1 text-sm sm:text-base">No tables found</p>
                            <p className="text-xs sm:text-sm text-[var(--muted)] mb-3 sm:mb-4">Add your first table</p>
                            <button onClick={() => openModal()} className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm active:scale-95">Add First Table</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
                            {filtered.map((table: any) => (
                                <div key={table.id} className="p-2.5 sm:p-3 lg:p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:shadow-lg hover:border-blue-600 transition-all group">
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg lg:text-xl shadow-sm" style={{ backgroundColor: getStatusColor(table.status) }}>
                                            {table.table_number}
                                        </div>
                                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium capitalize" style={{ backgroundColor: `${getStatusColor(table.status)}20`, color: getStatusColor(table.status) }} title="Managed by staff">
                                        {table.status}
                                    </span>
                                    </div>

                                    <div className="mb-2 sm:mb-3">
                                        <p className="text-xs sm:text-sm font-medium text-[var(--fg)] mb-0.5 sm:mb-1">{table.capacity} Seats</p>
                                        <p className="text-xs text-[var(--muted)]">📍 {table.section || 'Main'}</p>
                                    </div>

                                    <div className="flex gap-1.5 sm:gap-2">
                                        <button onClick={() => openModal(table)} className="flex-1 py-1 sm:py-1.5 text-blue-600 hover:bg-blue-600/10 rounded text-xs font-medium transition-colors active:scale-95">Edit</button>
                                        <button onClick={() => deleteTable(table.id)} disabled={table.status === 'occupied' || table.status === 'reserved'} className="flex-1 py-1 sm:py-1.5 text-red-600 hover:bg-red-600/10 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95" title={table.status === 'occupied' || table.status === 'reserved' ? 'Cannot delete' : 'Delete'}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <FormModal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Table' : 'Add Table'} onSubmit={save} submitLabel={modal?.id ? 'Update' : 'Add'}>
                <div className="space-y-4">
                    {modal?.id && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                            <p className="text-xs text-yellow-600">⚠️ Status: <strong className="capitalize">{modal.status}</strong><br/><span className="text-yellow-600/80">(Cannot be changed)</span></p>
                        </div>
                    )}
                    <FormGrid>
                        <ResponsiveInput label="Table Number" type="number" value={form.table_number} onChange={(e: any) => setForm({ ...form, table_number: e.target.value })} placeholder="1, 2, 3..." required hint="Unique number" />
                        <ResponsiveInput label="Capacity" type="number" value={form.capacity} onChange={(e: any) => setForm({ ...form, capacity: e.target.value })} placeholder="4, 6, 8..." required hint="Max people" />
                    </FormGrid>
                    <ResponsiveInput label="Section" value={form.section} onChange={(e: any) => setForm({ ...form, section: e.target.value })} placeholder="Main, Outdoor, VIP..." hint="Defaults to 'Main'" />
                </div>
            </FormModal>
        </>
    )
}
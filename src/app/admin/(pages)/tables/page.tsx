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
    const { data: tables, loading, insert, update, remove } = useSupabase('restaurant_tables', {
        order: { column: 'table_number' },
        realtime: true
    })

    const [sectionFilter, setSectionFilter] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({
        table_number: '',
        capacity: '',
        section: ''
    })
    const toast = useToast()

    // Get unique sections
    const sections = Array.from(new Set(tables.map((t: any) => t.section).filter(Boolean)))

    const filtered = tables.filter((t: any) => {
        if (sectionFilter === 'all') return true
        return t.section === sectionFilter
    })

    const getStatusColor = (status: string) => {
        const colors = {
            available: '#10b981',
            occupied: '#ef4444',
            reserved: '#f59e0b',
            cleaning: '#3b82f6'
        }
        return colors[status as keyof typeof colors] || '#6b7280'
    }

    // 🎯 STATS - By Section
    const stats = [
        {
            label: 'Total Tables',
            value: tables.length,
            color: '#3b82f6',
            onClick: () => setSectionFilter('all'),
            active: sectionFilter === 'all',
            subtext: `${sections.length} sections`
        },
        ...sections.map(section => ({
            label: section as string,
            value: tables.filter((t: any) => t.section === section).length,
            color: '#10b981',
            onClick: () => setSectionFilter(section as string),
            active: sectionFilter === section
        }))
    ]

    // 🎯 SIDEBAR ITEMS - By Section
    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Tables', icon: '🏠', count: tables.length },
        ...sections.map(section => ({
            id: section as string,
            label: section as string,
            icon: '📍',
            count: tables.filter((t: any) => t.section === section).length
        }))
    ], sectionFilter, setSectionFilter)

    const openModal = (table?: any) => {
        if (table) {
            setForm({
                table_number: table.table_number.toString(),
                capacity: table.capacity.toString(),
                section: table.section || ''
            })
        } else {
            setForm({ table_number: '', capacity: '', section: '' })
        }
        setModal(table || {})
    }

    const save = async () => {
        if (!form.table_number || !form.capacity) {
            toast.add('error', 'Table number and capacity required')
            return
        }

        // ✅ CHECK: Duplicate table number (only for new tables)
        if (!modal?.id) {
            const duplicate = tables.find((t: any) => t.table_number === parseInt(form.table_number))
            if (duplicate) {
                toast.add('error', `❌ Table ${form.table_number} already exists!`)
                return
            }
        }

        // ✅ CHECK: If editing, ensure table number isn't taken by another table
        if (modal?.id) {
            const duplicate = tables.find((t: any) =>
                t.table_number === parseInt(form.table_number) && t.id !== modal.id
            )
            if (duplicate) {
                toast.add('error', `❌ Table number ${form.table_number} is already used!`)
                return
            }
        }

        const data = {
            table_number: parseInt(form.table_number),
            capacity: parseInt(form.capacity),
            section: form.section || 'Main'
        }

        try {
            if (modal?.id) {
                const { error } = await update(modal.id, data)
                if (error) throw error
                toast.add('success', '✅ Table updated!')
            } else {
                // New table always starts as available
                const { error } = await insert({ ...data, status: 'available' })
                if (error) throw error
                toast.add('success', `✅ Table ${form.table_number} added!`)
            }
            setModal(null)
            setForm({ table_number: '', capacity: '', section: '' })
        } catch (error: any) {
            console.error('Save error:', error)

            // ✅ SPECIFIC ERROR MESSAGES
            if (error?.code === '23505') {
                toast.add('error', `❌ Table ${form.table_number} already exists!`)
            } else if (error?.message) {
                toast.add('error', `❌ ${error.message}`)
            } else {
                toast.add('error', '❌ Failed to save table. Please try again.')
            }
        }
    }

    const deleteTable = async (id: string) => {
        const table = tables.find((t: any) => t.id === id)

        // Prevent deletion of occupied/reserved tables
        if (table?.status === 'occupied' || table?.status === 'reserved') {
            toast.add('error', '❌ Cannot delete occupied or reserved tables')
            return
        }

        if (confirm('Delete this table? This action cannot be undone.')) {
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

    return (
        <>
            {/* 🎯 AUTO SIDEBAR - By Section */}
            <AutoSidebar items={sidebarItems} title="Filter by Section" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)] truncate">
                                    Tables Setup
                                </h1>
                                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                                    {filtered.length} tables • {sections.length} sections
                                </p>
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium flex-shrink-0 text-sm sm:text-base"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Table</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    {/* 📊 STATS - By Section */}
                    <ResponsiveStatsGrid
                        stats={stats}
                        columns={{ mobile: 2, tablet: 3, desktop: 4 }}
                    />

                    {/* Info Box */}
                    <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">
                            ℹ️ <strong>Admin Note:</strong> You can only add/edit table details here.
                            Table status (Available/Occupied) is managed automatically by the restaurant staff.
                        </p>
                    </div>

                    {/* 🎴 TABLES GRID */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
                            <div className="text-4xl mb-4">🪑</div>
                            <p className="text-[var(--fg)] font-medium mb-1">No tables found</p>
                            <p className="text-sm text-[var(--muted)]">Add your first table to get started</p>
                            <button
                                onClick={() => openModal()}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Add First Table
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {filtered.map((table: any) => (
                                <div
                                    key={table.id}
                                    className="p-3 sm:p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:shadow-lg hover:border-blue-600 transition-all group"
                                >
                                    {/* Table Number Badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm"
                                            style={{ backgroundColor: getStatusColor(table.status) }}
                                        >
                                            {table.table_number}
                                        </div>
                                        {/* Status Badge - READ ONLY */}
                                        <span
                                            className="px-2 py-1 rounded-md text-xs font-medium capitalize"
                                            style={{
                                                backgroundColor: `${getStatusColor(table.status)}20`,
                                                color: getStatusColor(table.status)
                                            }}
                                            title="Status managed by restaurant staff"
                                        >
                                            {table.status}
                                        </span>
                                    </div>

                                    {/* Table Info */}
                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-[var(--fg)] mb-1">
                                            {table.capacity} Seats
                                        </p>
                                        <p className="text-xs text-[var(--muted)]">
                                            📍 {table.section || 'Main'}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(table)}
                                            className="flex-1 py-1.5 text-blue-600 hover:bg-blue-600/10 rounded text-xs sm:text-sm font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteTable(table.id)}
                                            disabled={table.status === 'occupied' || table.status === 'reserved'}
                                            className="flex-1 py-1.5 text-red-600 hover:bg-red-600/10 rounded text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={
                                                table.status === 'occupied' || table.status === 'reserved'
                                                    ? 'Cannot delete occupied/reserved tables'
                                                    : 'Delete table'
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 🎯 ADD/EDIT MODAL - NO STATUS OPTION */}
            <FormModal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Table Details' : 'Add New Table'}
                onSubmit={save}
                submitLabel={modal?.id ? 'Update' : 'Add Table'}
            >
                <div className="space-y-4">
                    {/* Info for Edit Mode */}
                    {modal?.id && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                            <p className="text-xs text-yellow-600">
                                ⚠️ Current Status: <strong className="capitalize">{modal.status}</strong>
                                <br/>
                                <span className="text-yellow-600/80">
                                    (Status cannot be changed from admin panel)
                                </span>
                            </p>
                        </div>
                    )}

                    <FormGrid>
                        {/* Table Number */}
                        <ResponsiveInput
                            label="Table Number"
                            type="number"
                            value={form.table_number}
                            onChange={(e: any) => setForm({ ...form, table_number: e.target.value })}
                            placeholder="e.g., 1, 2, 3..."
                            required
                            hint="Unique number for this table"
                        />

                        {/* Capacity */}
                        <ResponsiveInput
                            label="Capacity (seats)"
                            type="number"
                            value={form.capacity}
                            onChange={(e: any) => setForm({ ...form, capacity: e.target.value })}
                            placeholder="e.g., 4, 6, 8..."
                            required
                            hint="Maximum number of people"
                        />
                    </FormGrid>

                    {/* Section */}
                    <ResponsiveInput
                        label="Section"
                        value={form.section}
                        onChange={(e: any) => setForm({ ...form, section: e.target.value })}
                        placeholder="e.g., Main, Outdoor, VIP, Rooftop"
                        hint="Area where table is located (defaults to 'Main')"
                    />
                </div>
            </FormModal>
        </>
    )
}
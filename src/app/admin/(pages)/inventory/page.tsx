// src/app/admin/(pages)/inventory/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, AlertCircle, TrendingDown, Package, TrendingUp } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { FormModal } from '@/components/ui/UniversalModal'
import ResponsiveInput, { FormGrid } from '@/components/ui/ResponsiveInput'
import { useToast } from '@/components/ui/Toast'
import type { InventoryItemWithCategory, InventoryCategory } from '@/types'

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItemWithCategory[]>([])
    const [categories, setCategories] = useState<InventoryCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [stockFilter, setStockFilter] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({
        name: '', category_id: '', quantity: '', unit: 'kg',
        reorder_level: '10', purchase_price: '', supplier_name: ''
    })
    const supabase = createClient()
    const toast = useToast()

    useState(() => {
        loadData()

        const channel = supabase
            .channel('inventory_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, loadData)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [itemsRes, categoriesRes] = await Promise.all([
                supabase.from('inventory_items').select('*, inventory_categories(name, icon)').eq('is_active', true).order('created_at', { ascending: false }),
                supabase.from('inventory_categories').select('*').eq('is_active', true).order('display_order')
            ])

            if (itemsRes.error) throw itemsRes.error
            if (categoriesRes.error) throw categoriesRes.error

            const enrichedItems = (itemsRes.data || []).map(item => ({
                ...item,
                total_value: item.quantity * item.purchase_price
            }))

            setItems(enrichedItems)
            setCategories(categoriesRes.data || [])
        } catch (error) {
            console.error('Load error:', error)
            toast.add('error', 'Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    const getStockStatus = (item: InventoryItemWithCategory) => {
        const percentage = (item.quantity / item.reorder_level) * 100
        if (percentage <= 50) return 'critical'
        if (percentage <= 100) return 'low'
        if (percentage <= 200) return 'medium'
        return 'high'
    }

    const filtered = items.filter(i => {
        if (stockFilter === 'all') return true
        return getStockStatus(i) === stockFilter
    })

    const stats = [
        { label: 'Critical', value: items.filter(i => getStockStatus(i) === 'critical').length, icon: AlertCircle, color: '#ef4444', onClick: () => setStockFilter('critical'), active: stockFilter === 'critical', subtext: 'Below 50%' },
        { label: 'Low Stock', value: items.filter(i => getStockStatus(i) === 'low').length, icon: TrendingDown, color: '#f59e0b', onClick: () => setStockFilter('low'), active: stockFilter === 'low', subtext: '50-100%' },
        { label: 'Medium', value: items.filter(i => getStockStatus(i) === 'medium').length, icon: Package, color: '#3b82f6', onClick: () => setStockFilter('medium'), active: stockFilter === 'medium', subtext: '100-200%' },
        { label: 'High Stock', value: items.filter(i => getStockStatus(i) === 'high').length, icon: TrendingUp, color: '#10b981', onClick: () => setStockFilter('high'), active: stockFilter === 'high', subtext: 'Above 200%' }
    ]

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Items', icon: '📦', count: items.length },
        { id: 'critical', label: 'Critical', icon: '🔴', count: stats[0].value },
        { id: 'low', label: 'Low Stock', icon: '🟡', count: stats[1].value },
        { id: 'medium', label: 'Medium', icon: '🔵', count: stats[2].value },
        { id: 'high', label: 'High Stock', icon: '🟢', count: stats[3].value }
    ], stockFilter, setStockFilter)

    const columns = [
        {
            key: 'item',
            label: 'Item',
            render: (row: InventoryItemWithCategory) => (
                <div>
                    <p className="font-medium text-[var(--fg)]">{row.name}</p>
                    {row.supplier_name && <p className="text-xs text-[var(--muted)]">{row.supplier_name}</p>}
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            mobileHidden: true,
            render: (row: InventoryItemWithCategory) => (
                <span className="text-sm text-[var(--muted)]">{row.inventory_categories?.icon} {row.inventory_categories?.name || 'N/A'}</span>
            )
        },
        {
            key: 'stock',
            label: 'Stock',
            render: (row: InventoryItemWithCategory) => {
                const status = getStockStatus(row)
                const colors = { critical: '#ef4444', low: '#f59e0b', medium: '#3b82f6', high: '#10b981' }
                return (
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: `${colors[status]}20`, color: colors[status] }}>
                        {row.quantity} {row.unit}
                    </span>
                )
            }
        },
        {
            key: 'price',
            label: 'Price',
            align: 'right' as const,
            render: (row: InventoryItemWithCategory) => <span className="text-sm text-[var(--fg)]">PKR {row.purchase_price.toLocaleString()}</span>
        },
        {
            key: 'value',
            label: 'Total Value',
            align: 'right' as const,
            render: (row: InventoryItemWithCategory) => <span className="font-bold text-[var(--fg)]">PKR {(row.total_value || 0).toLocaleString()}</span>
        }
    ]

    const renderMobileCard = (row: InventoryItemWithCategory) => {
        const status = getStockStatus(row)
        const colors = { critical: '#ef4444', low: '#f59e0b', medium: '#3b82f6', high: '#10b981' }
        return (
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-[var(--fg)]">{row.name}</p>
                        <p className="text-xs text-[var(--muted)]">{row.inventory_categories?.name || 'Uncategorized'}</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${colors[status]}20`, color: colors[status] }}>
                        {row.quantity} {row.unit}
                    </span>
                </div>
                <p className="text-lg font-bold">PKR {(row.total_value || 0).toLocaleString()}</p>
            </div>
        )
    }

    const openModal = (item?: InventoryItemWithCategory) => {
        if (item) {
            setForm({
                name: item.name,
                category_id: item.category_id || '',
                quantity: item.quantity.toString(),
                unit: item.unit,
                reorder_level: item.reorder_level.toString(),
                purchase_price: item.purchase_price.toString(),
                supplier_name: item.supplier_name || ''
            })
        } else {
            setForm({ name: '', category_id: '', quantity: '', unit: 'kg', reorder_level: '10', purchase_price: '', supplier_name: '' })
        }
        setModal(item || {})
    }

    const save = async () => {
        if (!form.name || !form.quantity || !form.purchase_price) {
            return toast.add('error', 'Fill required fields')
        }

        const data = {
            name: form.name,
            category_id: form.category_id || null,
            quantity: parseFloat(form.quantity),
            unit: form.unit,
            reorder_level: parseFloat(form.reorder_level),
            purchase_price: parseFloat(form.purchase_price),
            supplier_name: form.supplier_name || null,
            is_active: true
        }

        try {
            if (modal?.id) {
                const { error } = await supabase.from('inventory_items').update(data).eq('id', modal.id)
                if (error) throw error
                toast.add('success', '✅ Item updated!')
            } else {
                const { error } = await supabase.from('inventory_items').insert(data)
                if (error) throw error
                toast.add('success', '✅ Item added!')
            }
            setModal(null)
            loadData()
        } catch (error: any) {
            console.error('Save error:', error)
            toast.add('error', `❌ ${error.message || 'Failed to save'}`)
        }
    }

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Stock Status" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)] truncate">Inventory</h1>
                                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                                    {filtered.length} items • Total: PKR {items.reduce((s, i) => s + (i.total_value || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => openModal()} className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 flex-shrink-0">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    <ResponsiveStatsGrid stats={stats} />

                    <UniversalDataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        searchable
                        searchPlaceholder="Search inventory..."
                        onRowClick={openModal}
                        renderMobileCard={renderMobileCard}
                    />
                </div>
            </div>

            <FormModal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Item' : 'Add Item'} onSubmit={save}>
                <FormGrid>
                    <ResponsiveInput label="Item Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <ResponsiveInput label="Category" type="select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} options={categories.map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))} />
                    <ResponsiveInput label="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                    <ResponsiveInput label="Unit" type="select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} options={['kg', 'gram', 'liter', 'ml', 'pieces', 'dozen'].map(u => ({ label: u, value: u }))} />
                    <ResponsiveInput label="Purchase Price (PKR)" type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} required />
                    <ResponsiveInput label="Reorder Level" type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
                </FormGrid>
                <ResponsiveInput label="Supplier Name" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} className="mt-4" />
            </FormModal>
        </>
    )
}
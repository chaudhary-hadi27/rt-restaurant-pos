'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, AlertCircle, TrendingDown, Package, TrendingUp, FolderPlus, Edit2, Trash2 } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { FormModal } from '@/components/ui/UniversalModal'
import ResponsiveInput, { FormGrid } from '@/components/ui/ResponsiveInput'
import IconPicker from '@/components/ui/IconPicker'
import CloudinaryUpload from '@/components/ui/CloudinaryUpload'
import { useToast } from '@/components/ui/Toast'
import { validate } from '@/lib/utils/validation'
import type { InventoryItemWithCategory, InventoryCategory } from '@/types'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getStockStatusColor } from '@/lib/utils/statusHelpers'

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItemWithCategory[]>([])
    const [categories, setCategories] = useState<InventoryCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [stockFilter, setStockFilter] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [categoryModal, setCategoryModal] = useState<any>(null)
    const [showIconPicker, setShowIconPicker] = useState(false)
    const [form, setForm] = useState({
        name: '', category_id: '', quantity: '', unit: 'kg',
        reorder_level: '10', purchase_price: '', supplier_name: '', image_url: ''
    })
    const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦' })
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => {
        loadData()
        const channel = supabase
            .channel('inventory_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, loadData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_categories' }, loadData)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

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
            toast.add('error', '❌ Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    const getStockStatus = useMemo(() => (item: InventoryItemWithCategory) => {
        const percentage = (item.quantity / item.reorder_level) * 100
        if (percentage <= 50) return 'critical'
        if (percentage <= 100) return 'low'
        if (percentage <= 200) return 'medium'
        return 'high'
    }, [])

    const filtered = useMemo(
        () => items.filter(i => stockFilter === 'all' || getStockStatus(i) === stockFilter),
        [items, stockFilter, getStockStatus]
    )

    const stats = useMemo(() => [
        { label: 'Critical', value: items.filter(i => getStockStatus(i) === 'critical').length, color: '#ef4444', onClick: () => setStockFilter('critical'), active: stockFilter === 'critical' },
        { label: 'Low Stock', value: items.filter(i => getStockStatus(i) === 'low').length, color: '#f59e0b', onClick: () => setStockFilter('low'), active: stockFilter === 'low' },
        { label: 'Medium', value: items.filter(i => getStockStatus(i) === 'medium').length, color: '#3b82f6', onClick: () => setStockFilter('medium'), active: stockFilter === 'medium' },
        { label: 'High Stock', value: items.filter(i => getStockStatus(i) === 'high').length, color: '#10b981', onClick: () => setStockFilter('high'), active: stockFilter === 'high' }
    ], [items, getStockStatus, stockFilter])

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Items', icon: '📦', count: items.length },
        { id: 'critical', label: 'Critical', icon: '🔴', count: stats[0].value },
        { id: 'low', label: 'Low Stock', icon: '🟡', count: stats[1].value },
        { id: 'medium', label: 'Medium', icon: '🔵', count: stats[2].value },
        { id: 'high', label: 'High Stock', icon: '🟢', count: stats[3].value },
        { id: 'divider', label: '---', icon: '' },
        ...categories.map(cat => ({ id: cat.id, label: cat.name, icon: cat.icon || '📦', count: items.filter(i => i.category_id === cat.id).length }))
    ], stockFilter, setStockFilter)

    const columns = [
        {
            key: 'item',
            label: 'Item',
            render: (row: InventoryItemWithCategory) => (
                <div className="flex items-center gap-2">
                    {row.image_url && (
                        <img src={row.image_url} alt={row.name} className="w-10 h-10 rounded object-cover" />
                    )}
                    <div>
                        <p className="font-medium text-[var(--fg)] text-sm">{row.name}</p>
                        {row.supplier_name && <p className="text-xs text-[var(--muted)]">{row.supplier_name}</p>}
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            mobileHidden: true,
            render: (row: InventoryItemWithCategory) => (
                <span className="text-sm text-[var(--muted)]">{row.inventory_categories?.icon || '📦'} {row.inventory_categories?.name || 'N/A'}</span>
            )
        },
        {
            key: 'stock',
            label: 'Stock',
            render: (row: InventoryItemWithCategory) => {
                const status = getStockStatus(row)
                const statusColor = getStockStatusColor(status)
                return (
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
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
            label: 'Value',
            align: 'right' as const,
            render: (row: InventoryItemWithCategory) => <span className="font-bold text-sm sm:text-base text-[var(--fg)]">PKR {(row.total_value || 0).toLocaleString()}</span>
        }
    ]

    const openModal = (item?: InventoryItemWithCategory) => {
        if (item) {
            setForm({
                name: item.name,
                category_id: item.category_id || '',
                quantity: item.quantity.toString(),
                unit: item.unit,
                reorder_level: item.reorder_level.toString(),
                purchase_price: item.purchase_price.toString(),
                supplier_name: item.supplier_name || '',
                image_url: item.image_url || ''
            })
        } else {
            setForm({ name: '', category_id: '', quantity: '', unit: 'kg', reorder_level: '10', purchase_price: '', supplier_name: '', image_url: '' })
        }
        setModal(item || {})
    }

    const openCategoryModal = (category?: any) => {
        if (category) {
            setCategoryForm({ name: category.name, icon: category.icon || '📦' })
        } else {
            setCategoryForm({ name: '', icon: '📦' })
        }
        setCategoryModal(category || {})
    }

    const save = async () => {
        const errors = {
            name: validate.name(form.name),
            quantity: validate.price(form.quantity),
            price: validate.price(form.purchase_price)
        }

        if (errors.name || errors.quantity || errors.price) {
            return toast.add('error', Object.values(errors).find(e => e) || '❌ Invalid')
        }

        const data = {
            name: form.name,
            category_id: form.category_id || null,
            quantity: parseFloat(form.quantity),
            unit: form.unit,
            reorder_level: parseFloat(form.reorder_level),
            purchase_price: parseFloat(form.purchase_price),
            supplier_name: form.supplier_name || null,
            image_url: form.image_url || null,
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
            toast.add('error', `❌ ${error.message || 'Failed to save'}`)
        }
    }

    const saveCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.add('error', '❌ Category name required')
            return
        }

        try {
            if (categoryModal?.id) {
                const { error } = await supabase
                    .from('inventory_categories')
                    .update({ name: categoryForm.name, icon: categoryForm.icon || '📦' })
                    .eq('id', categoryModal.id)
                if (error) throw error
                toast.add('success', '✅ Category updated!')
            } else {
                const { error } = await supabase.from('inventory_categories').insert({
                    name: categoryForm.name,
                    icon: categoryForm.icon || '📦',
                    display_order: categories.length,
                    is_active: true
                })
                if (error) throw error
                toast.add('success', '✅ Category added!')
            }
            setCategoryModal(null)
            setCategoryForm({ name: '', icon: '📦' })
            loadData()
        } catch (error: any) {
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        }
    }

    const deleteCategory = async (id: string) => {
        const itemsInCategory = items.filter(i => i.category_id === id)
        if (itemsInCategory.length > 0) {
            return toast.add('error', `❌ Cannot delete! ${itemsInCategory.length} items in this category`)
        }

        if (!confirm('⚠️ Delete this category permanently?')) return

        try {
            const { error } = await supabase.from('inventory_categories').delete().eq('id', id)
            if (error) throw error
            toast.add('success', '✅ Category deleted!')
            loadData()
        } catch (error: any) {
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        }
    }

    const deleteItem = async (id: string, imageUrl?: string) => {
        if (!confirm('⚠️ Delete this inventory item permanently?')) return

        try {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id)
            if (error) throw error

            // Delete image from Cloudinary if exists
            if (imageUrl && imageUrl.includes('cloudinary')) {
                const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0]
                await fetch('/api/upload/cloudinary', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id: publicId })
                })
            }

            toast.add('success', '✅ Item deleted!')
            loadData()
        } catch (error: any) {
            toast.add('error', `❌ ${error.message || 'Failed'}`)
        }
    }

    return (
        <ErrorBoundary>
            <>
                <AutoSidebar items={sidebarItems} title="Stock Status" />

                <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                    <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg sm:text-2xl font-bold text-[var(--fg)] truncate">Inventory</h1>
                                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{filtered.length} items • PKR {items.reduce((s, i) => s + (i.total_value || 0), 0).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openCategoryModal()} className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 flex-shrink-0 text-sm active:scale-95">
                                        <FolderPlus className="w-4 h-4" />
                                        <span className="hidden sm:inline">Category</span>
                                    </button>
                                    <button onClick={() => openModal()} className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 flex-shrink-0 text-sm active:scale-95">
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">Add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Categories Section */}
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--fg)] mb-3">Manage Categories</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                                {categories.map(cat => (
                                    <div key={cat.id} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 sm:p-3 hover:border-blue-600 transition-all group">
                                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                                            <span className="text-xl sm:text-2xl">{cat.icon || '📦'}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openCategoryModal(cat)} className="p-1 text-blue-600 hover:bg-blue-600/10 rounded">
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => deleteCategory(cat.id)} className="p-1 text-red-600 hover:bg-red-600/10 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm font-medium text-[var(--fg)] truncate">{cat.name}</p>
                                        <p className="text-xs text-[var(--muted)]">{items.filter(i => i.category_id === cat.id).length} items</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
                        <ResponsiveStatsGrid stats={stats} />
                        <UniversalDataTable
                            columns={columns}
                            data={filtered}
                            loading={loading}
                            searchable
                            searchPlaceholder="Search inventory..."
                            onRowClick={openModal}
                            renderMobileCard={(row) => {
                                const status = getStockStatus(row)
                                const statusColor = getStockStatusColor(status)
                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {row.image_url && (
                                                    <img src={row.image_url} alt={row.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-[var(--fg)] text-sm truncate">{row.name}</p>
                                                    <p className="text-xs text-[var(--muted)]">{row.inventory_categories?.name || 'Uncategorized'}</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                                                {row.quantity} {row.unit}
                                            </span>
                                        </div>
                                        <p className="text-base font-bold">PKR {(row.total_value || 0).toLocaleString()}</p>
                                    </div>
                                )
                            }}
                        />
                    </div>
                </div>

                {/* Add/Edit Item Modal */}
                <FormModal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Item' : 'Add Item'} onSubmit={save}>
                    <FormGrid>
                        <ResponsiveInput label="Item Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        <ResponsiveInput label="Category" type="select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} options={categories.map(c => ({ label: `${c.icon || '📦'} ${c.name}`, value: c.id }))} />
                        <ResponsiveInput label="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                        <ResponsiveInput label="Unit" type="select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} options={['kg', 'gram', 'liter', 'ml', 'pieces', 'dozen'].map(u => ({ label: u, value: u }))} />
                        <ResponsiveInput label="Price (PKR)" type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} required />
                        <ResponsiveInput label="Reorder Level" type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
                    </FormGrid>
                    <ResponsiveInput label="Supplier" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} className="mt-4" />
                    <div className="mt-4">
                        <CloudinaryUpload value={form.image_url} onChange={url => setForm({ ...form, image_url: url })} folder="inventory-items" />
                    </div>
                </FormModal>

                {/* Add Category Modal */}
                <FormModal open={!!categoryModal} onClose={() => setCategoryModal(null)} title={categoryModal?.id ? 'Edit Category' : 'Add Category'} onSubmit={saveCategory}>
                    <ResponsiveInput label="Category Name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g., Vegetables, Meat" required />
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                            Icon <span className="text-xs text-[var(--muted)]">(Optional)</span>
                        </label>
                        <button onClick={() => setShowIconPicker(true)} className="w-full px-4 py-3 bg-[var(--bg)] border-2 border-[var(--border)] rounded-lg hover:border-blue-600 transition-all flex items-center justify-center gap-3">
                            <span className="text-4xl">{categoryForm.icon || '📦'}</span>
                            <span className="text-sm text-[var(--muted)]">Click to change (optional)</span>
                        </button>
                    </div>
                </FormModal>

                {/* Icon Picker */}
                {showIconPicker && (
                    <IconPicker
                        selected={categoryForm.icon}
                        onSelect={icon => setCategoryForm({ ...categoryForm, icon })}
                        onClose={() => setShowIconPicker(false)}
                    />
                )}
            </>
        </ErrorBoundary>
    )
}
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import { FormModal } from '@/components/ui/UniversalModal'
import ResponsiveInput, { FormGrid } from '@/components/ui/ResponsiveInput'
import { useToast } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function MenuPage() {
    const [items, setItems] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({
        name: '', category_id: '', price: '', description: '', image_url: ''
    })
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        const [cats, menu] = await Promise.all([
            supabase.from('menu_categories').select('*').order('display_order'),
            supabase.from('menu_items').select('*, menu_categories(name, icon)').order('created_at', { ascending: false })
        ])
        setCategories(cats.data || [])
        setItems(menu.data || [])
    }

    const save = async () => {
        if (!form.name || !form.category_id || !form.price) {
            return toast.add('error', 'Fill required fields')
        }

        const data = {
            name: form.name,
            category_id: form.category_id,
            price: +form.price,
            description: form.description || null,
            image_url: form.image_url || null,
            is_available: true
        }

        if (modal?.id) {
            await supabase.from('menu_items').update(data).eq('id', modal.id)
            toast.add('success', '✅ Menu item updated!')
        } else {
            await supabase.from('menu_items').insert(data)
            toast.add('success', '✅ Menu item added!')
        }

        setModal(null)
        setForm({ name: '', category_id: '', price: '', description: '', image_url: '' })
        load()
    }

    const del = async (id: string) => {
        if (confirm('Delete this item?')) {
            await supabase.from('menu_items').delete().eq('id', id)
            toast.add('success', '✅ Item deleted!')
            load()
        }
    }

    const openModal = (item?: any) => {
        if (item) {
            setForm({
                name: item.name,
                category_id: item.category_id,
                price: item.price.toString(),
                description: item.description || '',
                image_url: item.image_url || ''
            })
        } else {
            setForm({ name: '', category_id: '', price: '', description: '', image_url: '' })
        }
        setModal(item || {})
    }

    const filtered = selectedCategory === 'all'
        ? items
        : items.filter(i => i.category_id === selectedCategory)

    // 🎯 SIDEBAR ITEMS
    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Items', icon: '🍽️', count: items.length },
        ...categories.map(cat => ({
            id: cat.id,
            label: cat.name,
            icon: cat.icon,
            count: items.filter(i => i.category_id === cat.id).length
        }))
    ], selectedCategory, setSelectedCategory)

    return (
        <ErrorBoundary>
        <>
            <AutoSidebar items={sidebarItems} title="Menu Categories" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--fg)]">Menu Management</h1>
                                <p className="text-sm text-[var(--muted)] mt-1">{filtered.length} items</p>
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Item
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map(i => (
                            <div key={i.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                {i.image_url && (
                                    <img src={i.image_url} alt={i.name} className="w-full h-40 object-cover" />
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--fg)] truncate">{i.name}</h3>
                                            <p className="text-xs text-[var(--muted)]">
                                                {i.menu_categories?.icon} {i.menu_categories?.name}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ml-2 ${
                                            i.is_available
                                                ? 'bg-green-500/20 text-green-600'
                                                : 'bg-red-500/20 text-red-600'
                                        }`}>
                                            {i.is_available ? 'Available' : 'Out'}
                                        </span>
                                    </div>
                                    {i.description && (
                                        <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{i.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-blue-600">PKR {i.price}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(i)}
                                                className="p-2 text-blue-600 hover:bg-blue-600/10 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => del(i.id)}
                                                className="p-2 text-red-600 hover:bg-red-600/10 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <FormModal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Menu Item' : 'Add Menu Item'}
                onSubmit={save}
            >
                <div className="space-y-4">
                    <ResponsiveInput
                        label="Item Name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., Chicken Biryani"
                        required
                    />

                    <ResponsiveInput
                        label="Category"
                        type="select"
                        value={form.category_id}
                        onChange={e => setForm({ ...form, category_id: e.target.value })}
                        options={categories.map(c => ({
                            label: `${c.icon} ${c.name}`,
                            value: c.id
                        }))}
                        required
                    />

                    <ResponsiveInput
                        label="Price (PKR)"
                        type="number"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        placeholder="450"
                        required
                    />

                    <ResponsiveInput
                        label="Description"
                        type="textarea"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        placeholder="Delicious basmati rice with tender chicken..."
                    />

                    <ResponsiveInput
                        label="Image URL"
                        value={form.image_url}
                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        hint="Optional: Add image from Unsplash or Google Images"
                    />
                </div>
            </FormModal>
        </>
        </ErrorBoundary>
    )
}
// src/app/admin/menu/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import NestedSidebar from '@/components/layout/NestedSidebar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function MenuPage() {
    const [items, setItems] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ name: '', category_id: '', price: '', description: '', image_url: '' })
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
            toast.add('error', 'Please fill required fields')
            return
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

    // Nested Sidebar Items
    const sidebarItems = [
        {
            id: 'all',
            label: 'All Items',
            icon: '🍽️',
            count: items.length,
            active: selectedCategory === 'all',
            onClick: () => setSelectedCategory('all')
        },
        ...categories.map(cat => ({
            id: cat.id,
            label: cat.name,
            icon: cat.icon,
            count: items.filter(i => i.category_id === cat.id).length,
            active: selectedCategory === cat.id,
            onClick: () => setSelectedCategory(cat.id)
        }))
    ]

    return (
        <>
            <NestedSidebar title="Menu Categories" items={sidebarItems} />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <header className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--fg)]">Menu Management</h1>
                                <p className="text-sm text-[var(--muted)] mt-1">{filtered.length} items</p>
                            </div>
                            <Button onClick={() => openModal()}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(i => (
                            <div key={i.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-40 object-cover" />}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-[var(--fg)]">{i.name}</h3>
                                            <p className="text-xs text-[var(--muted)]">{i.menu_categories?.icon} {i.menu_categories?.name}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${i.is_available ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                            {i.is_available ? 'Available' : 'Out'}
                                        </span>
                                    </div>
                                    {i.description && <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{i.description}</p>}
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-blue-600">PKR {i.price}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => openModal(i)} className="px-3 py-1 text-xs bg-[var(--bg)] rounded hover:bg-blue-600/10 text-blue-600 font-medium">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => del(i.id)} className="px-3 py-1 text-xs bg-[var(--bg)] rounded hover:bg-red-600/10 text-red-600 font-medium">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Menu Item' : 'Add Menu Item'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
                        <Button onClick={save} className="flex-1">Save</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input label="Name *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-[var(--fg)] mb-2">Category *</label>
                        <select
                            value={form.category_id}
                            onChange={e => setForm({ ...form, category_id: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input label="Price (PKR) *" type="number" value={form.price} onChange={(e: any) => setForm({ ...form, price: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-[var(--fg)] mb-2">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                        />
                    </div>
                    <Input label="Image URL" value={form.image_url} onChange={(e: any) => setForm({ ...form, image_url: e.target.value })} />
                </div>
            </Modal>
        </>
    )
}
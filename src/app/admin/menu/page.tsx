"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function MenuPage() {
    const [items, setItems] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ name: '', category_id: '', price: '', description: '', image_url: '' })
    const supabase = createClient()

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
        } else {
            await supabase.from('menu_items').insert(data)
        }

        setModal(null)
        setForm({ name: '', category_id: '', price: '', description: '', image_url: '' })
        load()
    }

    const del = async (id: string) => {
        if (confirm('Delete this item?')) {
            await supabase.from('menu_items').delete().eq('id', id)
            load()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Menu</h1>
                    <p className="text-sm text-[var(--muted)]">{items.length} items</p>
                </div>
                <Button onClick={() => { setModal({}); setForm({ name: '', category_id: '', price: '', description: '', image_url: '' }) }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(i => (
                    <div key={i.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                        {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-40 object-cover" />}
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-[var(--fg)]">{i.name}</h3>
                                    <p className="text-xs text-[var(--muted)]">{i.menu_categories?.name}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${i.is_available ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                  {i.is_available ? 'Available' : 'Out'}
                </span>
                            </div>
                            {i.description && <p className="text-sm text-[var(--muted)] mb-3">{i.description}</p>}
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-blue-600">PKR {i.price}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setModal(i); setForm({ name: i.name, category_id: i.category_id, price: i.price, description: i.description, image_url: i.image_url }) }} className="text-blue-600 text-sm">Edit</button>
                                    <button onClick={() => del(i.id)} className="text-red-600 text-sm">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-[var(--fg)]">Category</label>
                        <select
                            value={form.category_id}
                            onChange={e => setForm({ ...form, category_id: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                        >
                            <option value="">Select</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input label="Price (PKR)" type="number" value={form.price} onChange={(e: any) => setForm({ ...form, price: e.target.value })} />
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-[var(--fg)]">Description</label>
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
        </div>
    )
}
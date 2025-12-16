// src/app/users/menu/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminMenuPage() {
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | null; item?: any }>({ type: null });
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [cats, menuItems] = await Promise.all([
            supabase.from('menu_categories').select('*').order('display_order'),
            supabase.from('menu_items').select('*, menu_categories(name, icon)').order('created_at', { ascending: false })
        ]);
        setCategories(cats.data || []);
        setItems(menuItems.data || []);
        setLoading(false);
    };

    const handleSubmit = async (formData: any) => {
        const data = {
            category_id: formData.category_id,
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price),
            image_url: formData.image_url || null,
            is_available: formData.is_available,
            preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null
        };

        if (dialog.type === 'edit' && dialog.item) {
            await supabase.from('menu_items').update(data).eq('id', dialog.item.id);
        } else {
            await supabase.from('menu_items').insert(data);
        }

        loadData();
        setDialog({ type: null });
    };

    const handleDelete = async () => {
        if (!dialog.item) return;
        await supabase.from('menu_items').delete().eq('id', dialog.item.id);
        loadData();
        setDialog({ type: null });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Menu Management</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{items.length} items</p>
                </div>
                <button onClick={() => setDialog({ type: 'add' })} className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                            {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover" />
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold" style={{ color: 'var(--fg)' }}>{item.name}</h3>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.menu_categories?.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${item.is_available ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                                </div>
                                {item.description && (
                                    <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{item.description}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>PKR {item.price}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setDialog({ type: 'edit', item })} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                            <Edit2 className="w-4 h-4" style={{ color: 'var(--fg)' }} />
                                        </button>
                                        <button onClick={() => setDialog({ type: 'delete', item })} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                            <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(dialog.type === 'add' || dialog.type === 'edit') && (
                <MenuDialog item={dialog.item} categories={categories} onClose={() => setDialog({ type: null })} onSubmit={handleSubmit} />
            )}

            {dialog.type === 'delete' && dialog.item && (
                <DeleteDialog item={dialog.item} onClose={() => setDialog({ type: null })} onDelete={handleDelete} />
            )}
        </div>
    );
}

function MenuDialog({ item, categories, onClose, onSubmit }: any) {
    const [form, setForm] = useState({
        category_id: item?.category_id || '',
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price?.toString() || '',
        image_url: item?.image_url || '',
        is_available: item?.is_available ?? true,
        preparation_time: item?.preparation_time?.toString() || ''
    });

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-2xl border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>{item ? 'Edit' : 'Add'} Menu Item</h3>
                    <button onClick={onClose}><X className="w-5 h-5" style={{ color: 'var(--muted)' }} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} placeholder="Chicken Karahi" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Category *</label>
                            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
                                <option value="">Select Category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} placeholder="Delicious traditional..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Price (PKR) *</label>
                            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} placeholder="800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Prep Time (min)</label>
                            <input type="number" value={form.preparation_time} onChange={(e) => setForm({ ...form, preparation_time: e.target.value })} className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} placeholder="20" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Image URL</label>
                        <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} placeholder="https://..." />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Available for Order</span>
                        <button onClick={() => setForm({ ...form, is_available: !form.is_available })} className={`relative w-11 h-6 rounded-full transition-colors ${form.is_available ? 'bg-green-500' : 'bg-gray-400'}`}>
                            <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform" style={{ transform: form.is_available ? 'translateX(20px)' : 'translateX(0)' }} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}>Cancel</button>
                    <button onClick={() => onSubmit(form)} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>{item ? 'Save' : 'Add'}</button>
                </div>
            </div>
        </div>
    );
}

function DeleteDialog({ item, onClose, onDelete }: any) {
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--fg)' }}>Delete {item.name}?</h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}>Cancel</button>
                    <button onClick={onDelete} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#ef4444', color: '#fff' }}>Delete</button>
                </div>
            </div>
        </div>
    );
}
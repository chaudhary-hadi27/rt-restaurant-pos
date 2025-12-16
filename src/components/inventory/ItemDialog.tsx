// src/components/inventory/ItemDialog.tsx

"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { InventoryItem, InventoryCategory } from '@/types';

interface ItemDialogProps {
    item?: InventoryItem;
    categories: InventoryCategory[];
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function ItemDialog({ item, categories, onClose, onSubmit }: ItemDialogProps) {
    const [form, setForm] = useState({
        category_id: item?.category_id || '',
        name: item?.name || '',
        description: item?.description || '',
        image_url: item?.image_url || '',
        quantity: item?.quantity.toString() || '',
        unit: item?.unit || 'kg',
        reorder_level: item?.reorder_level.toString() || '10',
        purchase_price: item?.purchase_price.toString() || '',
        supplier_name: item?.supplier_name || '',
        storage_location: item?.storage_location || ''
    });

    const units = ['kg', 'gram', 'liter', 'ml', 'pieces', 'dozen', 'packet', 'box'];

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-2xl border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Item Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                                placeholder="e.g., Tomatoes"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Category
                            </label>
                            <select
                                value={form.category_id}
                                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                            Image URL (Optional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={form.image_url}
                                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                                placeholder="https://example.com/image.jpg"
                            />
                            {form.image_url && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            Paste image URL (e.g., from Unsplash or Google Images)
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Quantity *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                                placeholder="50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Unit *
                            </label>
                            <select
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            >
                                {units.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Reorder Level *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.reorder_level}
                                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                                placeholder="10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Purchase Price (PKR) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.purchase_price}
                                onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                                placeholder="450"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                                Storage Location
                            </label>
                            <input
                                type="text"
                                value={form.storage_location}
                                onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                                placeholder="Freezer, Pantry, etc."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>
                            Supplier Name
                        </label>
                        <input
                            type="text"
                            value={form.supplier_name}
                            onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            placeholder="Supplier name"
                        />
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
                        style={{ color: 'var(--fg)', backgroundColor: 'var(--hover-bg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(form)}
                        className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        {item ? 'Save Changes' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    );
}
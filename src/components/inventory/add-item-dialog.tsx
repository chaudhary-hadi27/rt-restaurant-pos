"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';

export default function AddItemDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        unit: '',
        price: '',
        reorder_level: '10'
    });
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    const handleSubmit = async () => {
        if (!formData.name || !formData.quantity || !formData.unit || !formData.price) return;

        setLoading(true);
        const { error } = await supabase.from('inventory_items').insert({
            name: formData.name,
            quantity: parseInt(formData.quantity),
            unit: formData.unit,
            price: parseFloat(formData.price),
            reorder_level: parseInt(formData.reorder_level)
        });

        if (!error) {
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-4 md:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg md:text-xl font-semibold" style={{ color: 'var(--fg)' }}>Add Inventory Item</h3>
                    <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:brightness-110" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Item Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                            style={{
                                backgroundColor: 'var(--bg)',
                                borderColor: 'var(--border)',
                                color: 'var(--fg)'
                            }}
                            placeholder="e.g., Tomatoes"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Quantity</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                                style={{
                                    backgroundColor: 'var(--bg)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--fg)'
                                }}
                                placeholder="100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Unit</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                                style={{
                                    backgroundColor: 'var(--bg)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--fg)'
                                }}
                                placeholder="kg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Price</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                                style={{
                                    backgroundColor: 'var(--bg)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--fg)'
                                }}
                                placeholder="10.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Reorder Level</label>
                            <input
                                type="number"
                                value={formData.reorder_level}
                                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                                style={{
                                    backgroundColor: 'var(--bg)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--fg)'
                                }}
                                placeholder="10"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 md:p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg transition-colors hover:brightness-110 text-sm md:text-base"
                        style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name || !formData.quantity || !formData.unit || !formData.price}
                        className="flex-1 px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 text-sm md:text-base"
                        style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                    >
                        {loading ? 'Adding...' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    );
}
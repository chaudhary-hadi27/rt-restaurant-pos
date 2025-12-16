"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waiter } from '@/types';
import { X } from 'lucide-react';

export default function WaiterDialog({
                                         waiter,
                                         onClose,
                                         onSuccess
                                     }: {
    waiter: Waiter | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: waiter?.name || '',
        phone: waiter?.phone || '',
        profile_pic: waiter?.profile_pic || '',
        is_active: waiter?.is_active ?? true
    });
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async () => {
        if (!formData.name) return;

        setLoading(true);
        const data = {
            name: formData.name,
            phone: formData.phone || null,
            profile_pic: formData.profile_pic || null,
            is_active: formData.is_active
        };

        const { error } = waiter
            ? await supabase.from('waiters').update(data).eq('id', waiter.id)
            : await supabase.from('waiters').insert({ ...data, total_orders: 0, total_revenue: 0 });

        if (!error) onSuccess();
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-lg w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                        {waiter ? 'Edit Waiter' : 'Add Waiter'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            placeholder="+1 234 567 8900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Profile Picture URL</label>
                        <input
                            type="text"
                            value={formData.profile_pic}
                            onChange={(e) => setFormData({ ...formData, profile_pic: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            placeholder="https://example.com/photo.jpg"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Active Status</span>
                        <button
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className="relative w-11 h-6 rounded-full transition-colors"
                            style={{ backgroundColor: formData.is_active ? 'var(--primary)' : 'var(--border)' }}
                        >
                            <span
                                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
                                style={{ transform: formData.is_active ? 'translateX(20px)' : 'translateX(0)' }}
                            />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg hover:opacity-80"
                        style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name}
                        className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                    >
                        {loading ? 'Saving...' : waiter ? 'Update' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}
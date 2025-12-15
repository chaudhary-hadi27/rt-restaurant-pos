"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem } from '@/types';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirm({
                                          item,
                                          onClose,
                                          onSuccess
                                      }: {
    item: InventoryItem;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleDelete = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', item.id);

        if (!error) {
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-4 md:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg md:text-xl font-semibold" style={{ color: 'var(--fg)' }}>Delete Item</h3>
                    <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:brightness-110" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#ef444420' }}>
                        <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />
                    </div>

                    <p className="text-base md:text-lg font-medium mb-2" style={{ color: 'var(--fg)' }}>Are you sure?</p>
                    <p className="text-sm md:text-base" style={{ color: 'var(--muted)' }}>
                        This will permanently delete <span className="font-semibold" style={{ color: 'var(--fg)' }}>{item.name}</span> from your inventory. This action cannot be undone.
                    </p>
                </div>

                <div className="flex items-center gap-3 p-4 md:p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg transition-colors hover:brightness-110"
                        style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    >
                        {loading ? 'Deleting...' : 'Delete Item'}
                    </button>
                </div>
            </div>
        </div>
    );
}
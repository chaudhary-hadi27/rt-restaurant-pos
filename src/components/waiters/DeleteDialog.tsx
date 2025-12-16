"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waiter } from '@/types';
import { X, AlertTriangle } from 'lucide-react';

export default function DeleteDialog({
                                         waiter,
                                         onClose,
                                         onSuccess
                                     }: {
    waiter: Waiter;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleDelete = async () => {
        setLoading(true);
        const { error } = await supabase.from('waiters').delete().eq('id', waiter.id);
        if (!error) onSuccess();
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-lg w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Delete Waiter</h3>
                    <button onClick={onClose} className="p-1 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#ef444420' }}>
                        <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />
                    </div>
                    <p className="text-base font-medium mb-2" style={{ color: 'var(--fg)' }}>Are you sure?</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Delete <span className="font-semibold" style={{ color: 'var(--fg)' }}>{waiter.name}</span>? This action cannot be undone.
                    </p>
                </div>

                <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg hover:opacity-80"
                        style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
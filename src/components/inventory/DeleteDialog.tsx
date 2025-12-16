// src/components/inventory/DeleteDialog.tsx

"use client";

import { InventoryItem } from '@/types';

interface DeleteDialogProps {
    item: InventoryItem;
    onClose: () => void;
    onDelete: () => void;
}

export default function DeleteDialog({ item, onClose, onDelete }: DeleteDialogProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                        Delete Item
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                        Are you sure you want to delete <span className="font-semibold" style={{ color: 'var(--fg)' }}>{item.name}</span>? This action cannot be undone.
                    </p>
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
                        onClick={onDelete}
                        className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
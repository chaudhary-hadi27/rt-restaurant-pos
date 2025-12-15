"use client";

import { useState } from 'react';
import { InventoryItem } from '@/types';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';
import EditItemDialog from '@/components/inventory/edit-item-dialog';
import DeleteConfirm from '@/components/inventory/delete-confirm';

export default function InventoryList({
                                          items,
                                          onUpdate,
                                          loading
                                      }: {
    items: InventoryItem[];
    onUpdate: () => void;
    loading: boolean;
}) {
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

    if (loading) {
        return (
            <div className="rounded-xl p-8 text-center border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <p style={{ color: 'var(--muted)' }}>Loading inventory...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl p-12 text-center border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <p style={{ color: 'var(--muted)' }}>No inventory items found</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <tr className="border-b">
                            <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Item Name</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Quantity</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Unit</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Price</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Total</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Status</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold" style={{ color: 'var(--fg)' }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((item) => {
                            const isLowStock = item.quantity <= item.reorder_level;
                            const totalValue = item.price * item.quantity;

                            return (
                                <tr key={item.id} className="border-b transition-colors hover:brightness-110" style={{ borderColor: 'var(--border)' }}>
                                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-sm md:text-base" style={{ color: 'var(--fg)' }}>{item.name}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base">
                      <span style={{ color: isLowStock ? '#f59e0b' : 'var(--fg)' }} className={isLowStock ? 'font-semibold' : ''}>
                        {item.quantity}
                      </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base" style={{ color: 'var(--muted)' }}>{item.unit}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base" style={{ color: 'var(--fg)' }}>${item.price.toFixed(2)}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 font-semibold text-sm md:text-base" style={{ color: 'var(--fg)' }}>${totalValue.toFixed(2)}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        {isLowStock ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                          <AlertTriangle className="w-3 h-3" />
                          Low
                        </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
                          Stock
                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ color: 'var(--muted)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteItem(item)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ color: '#ef4444' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef444420'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {editItem && (
                <EditItemDialog
                    item={editItem}
                    onClose={() => setEditItem(null)}
                    onSuccess={() => {
                        setEditItem(null);
                        onUpdate();
                    }}
                />
            )}

            {deleteItem && (
                <DeleteConfirm
                    item={deleteItem}
                    onClose={() => setDeleteItem(null)}
                    onSuccess={() => {
                        setDeleteItem(null);
                        onUpdate();
                    }}
                />
            )}
        </>
    );
}
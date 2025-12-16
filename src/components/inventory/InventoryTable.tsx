// src/components/inventory/InventoryTable.tsx

"use client";

import { InventoryItem } from '@/types';
import { Package } from 'lucide-react';
import { getStockStatus, getStockStatusColor, getStockStatusEmoji } from '@/lib/utils/stockHelpers';

interface InventoryTableProps {
    items: InventoryItem[];
    loading: boolean;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
}

export default function InventoryTable({ items, loading, onEdit, onDelete }: InventoryTableProps) {
    if (loading) {
        return (
            <div className="rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)' }}></div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading items...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
                    <p className="font-medium mb-1" style={{ color: 'var(--fg)' }}>No items found</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Try adjusting your search or filters</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--sidebar-bg)' }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>ITEM</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>CATEGORY</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>STOCK STATUS</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>QUANTITY</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>PRICE</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>VALUE</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>ACTIONS</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((item, idx) => {
                        const stockStatus = getStockStatus(item);
                        const statusColor = getStockStatusColor(stockStatus);
                        const statusEmoji = getStockStatusEmoji(stockStatus);

                        return (
                            <tr
                                key={item.id}
                                className="border-b hover:bg-opacity-50 transition-colors"
                                style={{
                                    borderColor: 'var(--border)',
                                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--hover-bg)'
                                }}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl">
                                                    {item.category_icon || '📦'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm" style={{ color: 'var(--fg)' }}>{item.name}</div>
                                            {item.supplier_name && (
                                                <div className="text-xs" style={{ color: 'var(--muted)' }}>{item.supplier_name}</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                        <span className="text-sm" style={{ color: 'var(--muted)' }}>
                                            {item.category_name || 'Uncategorized'}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                        <span
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                                            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                                        >
                                            {statusEmoji} {stockStatus.toUpperCase()}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                                        {item.quantity} {item.unit}
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                        Reorder: {item.reorder_level}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                        <span className="text-sm" style={{ color: 'var(--fg)' }}>
                                            PKR {item.purchase_price.toLocaleString()}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                                            PKR {(item.total_value || 0).toLocaleString()}
                                        </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            style={{ color: 'var(--fg)', backgroundColor: 'var(--hover-bg)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(item)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            style={{ color: 'var(--fg)', backgroundColor: 'var(--hover-bg)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                        >
                                            Delete
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
    );
}
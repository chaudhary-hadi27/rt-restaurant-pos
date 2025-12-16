// src/lib/utils/stockHelpers.ts

import { InventoryItem } from '@/types';

export type StockStatus = 'high' | 'medium' | 'low' | 'critical';

export const getStockStatus = (item: InventoryItem): StockStatus => {
    const percentage = (item.quantity / item.reorder_level) * 100;
    if (percentage <= 50) return 'critical';
    if (percentage <= 100) return 'low';
    if (percentage <= 200) return 'medium';
    return 'high';
};

export const getStockStatusColor = (status: StockStatus): string => {
    const colors = {
        critical: '#ef4444',
        low: '#f59e0b',
        medium: 'var(--accent)',
        high: '#10b981'
    };
    return colors[status];
};

export const getStockStatusEmoji = (status: StockStatus): string => {
    const emojis = {
        critical: '🔴',
        low: '🟡',
        medium: '🔵',
        high: '🟢'
    };
    return emojis[status];
};
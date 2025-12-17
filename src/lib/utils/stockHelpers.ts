// src/lib/utils/stockHelpers.ts
import { InventoryItem, StockStatus } from '@/types'

export const getStockStatus = (item: InventoryItem): StockStatus => {
    const percentage = (item.quantity / item.reorder_level) * 100
    if (percentage <= 50) return 'critical'
    if (percentage <= 100) return 'low'
    if (percentage <= 200) return 'medium'
    return 'high'
}

export const getStockStatusColor = (status: StockStatus): string => {
    const colors: Record<StockStatus, string> = {
        critical: '#ef4444',
        low: '#f59e0b',
        medium: '#3b82f6',
        high: '#10b981'
    }
    return colors[status]
}

export const getStockStatusEmoji = (status: StockStatus): string => {
    const emojis: Record<StockStatus, string> = {
        critical: '🔴',
        low: '🟡',
        medium: '🔵',
        high: '🟢'
    }
    return emojis[status]
}

export const getStockPercentage = (item: InventoryItem): number => {
    return (item.quantity / item.reorder_level) * 100
}
// src/components/inventory/StockAnalytics.tsx

"use client";

import { AlertCircle, TrendingDown, Package, TrendingUp } from 'lucide-react';

interface StockAnalyticsProps {
    stats: {
        critical: number;
        low: number;
        medium: number;
        high: number;
    };
    selectedFilter: string;
    onFilterChange: (filter: string) => void;
}

export default function StockAnalytics({ stats, selectedFilter, onFilterChange }: StockAnalyticsProps) {
    const cards = [
        {
            id: 'critical',
            label: 'CRITICAL',
            icon: AlertCircle,
            color: '#ef4444',
            count: stats.critical,
            description: 'Below 50% stock'
        },
        {
            id: 'low',
            label: 'LOW STOCK',
            icon: TrendingDown,
            color: '#f59e0b',
            count: stats.low,
            description: '50-100% stock'
        },
        {
            id: 'medium',
            label: 'MEDIUM',
            icon: Package,
            color: 'var(--accent)',
            count: stats.medium,
            description: '100-200% stock'
        },
        {
            id: 'high',
            label: 'HIGH STOCK',
            icon: TrendingUp,
            color: '#10b981',
            count: stats.high,
            description: 'Above 200% stock'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map(card => {
                const Icon = card.icon;
                const isActive = selectedFilter === card.id;

                return (
                    <button
                        key={card.id}
                        onClick={() => onFilterChange(isActive ? 'all' : card.id)}
                        className="p-4 rounded-lg border text-left transition-all"
                        style={{
                            backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--card)',
                            borderColor: isActive ? 'var(--accent)' : 'var(--border)'
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4" style={{ color: card.color }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                                {card.label}
                            </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                            {card.count}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            {card.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}
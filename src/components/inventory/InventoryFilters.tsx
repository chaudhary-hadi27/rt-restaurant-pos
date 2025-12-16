// src/components/inventory/InventoryFilters.tsx

"use client";

import { Search, ChevronDown } from 'lucide-react';
import { InventoryCategory } from '@/types';

interface InventoryFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: InventoryCategory[];
}

export default function InventoryFilters({
                                             search,
                                             onSearchChange,
                                             selectedCategory,
                                             onCategoryChange,
                                             categories
                                         }: InventoryFiltersProps) {
    return (
        <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                />
            </div>

            {/* Category Filter */}
            <div className="relative">
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="pl-4 pr-10 py-2.5 rounded-lg border focus:outline-none appearance-none text-sm font-medium min-w-[180px]"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted)' }} />
            </div>
        </div>
    );
}
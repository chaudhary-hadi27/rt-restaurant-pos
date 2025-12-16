'use client'

import { Search } from 'lucide-react'

interface SearchFilterProps {
    search: string
    onSearchChange: (value: string) => void
    filters?: Array<{ label: string; value: string }>
    selectedFilter?: string
    onFilterChange?: (value: string) => void
    placeholder?: string
}

export function SearchFilter({
                                 search,
                                 onSearchChange,
                                 filters,
                                 selectedFilter,
                                 onFilterChange,
                                 placeholder = 'Search...'
                             }: SearchFilterProps) {
    return (
        <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
            </div>
            {filters && onFilterChange && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {filters.map(f => (
                        <button
                            key={f.value}
                            onClick={() => onFilterChange(f.value)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                selectedFilter === f.value
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-[var(--card)] text-[var(--fg)] border border-[var(--border)]'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

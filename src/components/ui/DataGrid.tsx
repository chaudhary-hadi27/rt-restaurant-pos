'use client'

import { ReactNode } from 'react'

interface Column<T> {
    key: keyof T | string
    label: string
    render?: (item: T) => ReactNode
    className?: string
}

interface DataGridProps<T> {
    data: T[]
    columns: Column<T>[]
    loading?: boolean
    onRowClick?: (item: T) => void
    emptyMessage?: string
    keyExtractor?: (item: T) => string
}

export function DataGrid<T extends Record<string, any>>({
                                                            data,
                                                            columns,
                                                            loading,
                                                            onRowClick,
                                                            emptyMessage = 'No data found',
                                                            keyExtractor = (item) => item.id
                                                        }: DataGridProps<T>) {
    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[var(--muted)]">Loading...</p>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-[var(--muted)]">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {columns.map((col, i) => (
                        <th key={i} className={`px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] ${col.className || ''}`}>
                            {col.label}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map((item) => (
                    <tr
                        key={keyExtractor(item)}
                        onClick={() => onRowClick?.(item)}
                        className={`border-b hover:bg-[var(--bg)] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                        style={{ borderColor: 'var(--border)' }}
                    >
                        {columns.map((col, i) => (
                            <td key={i} className={`px-4 py-3 text-[var(--fg)] ${col.className || ''}`}>
                                {col.render ? col.render(item) : item[col.key as keyof T]}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

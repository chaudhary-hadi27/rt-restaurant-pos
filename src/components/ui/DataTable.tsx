interface Column {
    key: string
    label: string
    render?: (row: any) => React.ReactNode
    align?: 'left' | 'right' | 'center'
}

interface DataTableProps {
    columns: Column[]
    data: any[]
    loading?: boolean
    emptyMessage?: string
}

export function DataTable({ columns, data, loading, emptyMessage = 'No data found' }: DataTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl">
                <div className="text-center py-12">
                    <p className="text-[var(--muted)]">{emptyMessage}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                        {columns.map(col => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider text-${col.align || 'left'}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg)] transition-colors">
                            {columns.map(col => (
                                <td key={col.key} className={`px-4 py-4 text-${col.align || 'left'}`}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

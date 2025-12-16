interface StatCardProps {
    label: string
    value: string | number
    onClick?: () => void
    active?: boolean
}

interface StatsGridProps {
    stats: StatCardProps[]
}

export function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <button
                    key={stat.label}
                    onClick={stat.onClick}
                    disabled={!stat.onClick}
                    className={`p-4 rounded-lg border transition-all text-left ${
                        stat.active
                            ? 'bg-blue-600/10 border-blue-600'
                            : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--fg)]'
                    } ${stat.onClick ? 'cursor-pointer' : 'cursor-default'}`}
                >
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
                        {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-[var(--fg)]">{stat.value}</p>
                </button>
            ))}
        </div>
    )
}
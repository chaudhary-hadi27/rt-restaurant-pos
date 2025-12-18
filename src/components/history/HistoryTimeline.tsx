import { Clock, Plus, Edit, Trash, CheckCircle, TrendingUp, Package, Users, LayoutGrid, UtensilsCrossed } from 'lucide-react'

const ICONS = {
    orders: CheckCircle,
    inventory_items: Package,
    restaurant_tables: LayoutGrid,
    menu_items: UtensilsCrossed,
    waiters: Users
}

const COLORS = {
    created: '#10b981',
    updated: '#3b82f6',
    deleted: '#ef4444',
    status_changed: '#f59e0b'
}

export default function HistoryTimeline({ data, compact = false }) {
    const groupByDate = (logs) => {
        const groups = {}
        logs.forEach(log => {
            const date = new Date(log.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            })
            if (!groups[date]) groups[date] = []
            groups[date].push(log)
        })
        return groups
    }

    const grouped = groupByDate(data)

    const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    })

    const getChangeText = (log) => {
        const entity = log.entity_type.replace('_', ' ')
        const name = log.metadata?.entity_name || log.entity_id.slice(0, 8)

        if (log.action === 'created') return `Created ${entity}: ${name}`
        if (log.action === 'deleted') return `Deleted ${entity}: ${name}`
        if (log.action === 'status_changed') {
            const from = log.changes?.status?.from
            const to = log.changes?.status?.to
            return `${name} status: ${from} → ${to}`
        }
        if (log.action === 'updated') {
            const changes = Object.keys(log.changes || {}).filter(k => log.changes[k])
            return `Updated ${entity}: ${changes.join(', ')}`
        }
        return log.action
    }

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([date, logs]) => (
                <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-[var(--border)]" />
                        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              {date}
            </span>
                        <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    {/* Timeline Items */}
                    <div className="space-y-3">
                        {logs.map((log, idx) => {
                            const Icon = ICONS[log.entity_type] || Clock
                            const color = COLORS[log.action] || '#6b7280'

                            return (
                                <div key={log.id} className="flex gap-4">
                                    {/* Timeline Dot */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <Icon className="w-4 h-4" style={{ color }} />
                                        </div>
                                        {idx < logs.length - 1 && (
                                            <div className="w-0.5 flex-1 mt-2 mb-2 bg-[var(--border)]" style={{ minHeight: '20px' }} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm font-medium text-[var(--fg)]">
                                                {getChangeText(log)}
                                            </p>
                                            <span className="text-xs text-[var(--muted)] whitespace-nowrap ml-3">
                        {formatTime(log.created_at)}
                      </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                                            {log.user_name && (
                                                <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                                                    {log.user_name}
                        </span>
                                            )}
                                            {log.metadata?.amount && (
                                                <span className="px-2 py-0.5 bg-[var(--bg)] rounded-md font-medium">
                          PKR {log.metadata.amount.toLocaleString()}
                        </span>
                                            )}
                                        </div>

                                        {/* Detailed Changes - Expandable */}
                                        {!compact && log.changes && Object.keys(log.changes).length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-700">
                                                    View details
                                                </summary>
                                                <div className="mt-2 p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                          <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}

            {data.length === 0 && (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
                    <p className="text-[var(--muted)]">No history yet</p>
                </div>
            )}
        </div>
    )
}
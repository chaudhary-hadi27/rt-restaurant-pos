import { useRecentActivity } from '@/lib/hooks/useHistory'
import { Clock, Activity, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function RecentActivityWidget() {
    const { data, loading, stats } = useRecentActivity()

    const getActivityIcon = (type) => {
        const icons = {
            orders: '🛒',
            inventory_items: '📦',
            restaurant_tables: '🪑',
            menu_items: '🍽️',
            waiters: '👤'
        }
        return icons[type] || '📝'
    }

    const getActivityColor = (action) => {
        const colors = {
            created: '#10b981',
            updated: '#3b82f6',
            deleted: '#ef4444',
            status_changed: '#f59e0b'
        }
        return colors[action] || '#6b7280'
    }

    const formatTime = (date) => {
        const diff = Date.now() - new Date(date).getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(mins / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        if (mins > 0) return `${mins}m ago`
        return 'Just now'
    }

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-[var(--fg)]">Recent Activity</h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{stats.today} events today</p>
                    </div>
                </div>
                <Link
                    href="/admin/history"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    View all
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Activity Feed */}
            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : data.length > 0 ? (
                    <div className="space-y-3">
                        {data.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--bg)] transition-colors"
                            >
                <span className="text-2xl flex-shrink-0">
                  {getActivityIcon(log.entity_type)}
                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-[var(--fg)] line-clamp-2">
                                            <span className="font-medium">{log.user_name || 'System'}</span>
                                            {' '}
                                            <span
                                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getActivityColor(log.action)}20`,
                                                    color: getActivityColor(log.action)
                                                }}
                                            >
                        {log.action}
                      </span>
                                            {' '}
                                            {log.entity_type.replace('_', ' ')}
                                        </p>
                                        <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </span>
                                    </div>
                                    {log.metadata?.entity_name && (
                                        <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">
                                            {log.metadata.entity_name}
                                        </p>
                                    )}
                                    {log.metadata?.amount && (
                                        <span className="inline-block text-xs font-semibold mt-1 text-blue-600">
                      PKR {log.metadata.amount.toLocaleString()}
                    </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--fg)' }} />
                        <p className="text-sm text-[var(--muted)]">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Add to admin dashboard:
// import RecentActivityWidget from '@/components/history/RecentActivityWidget'
// <RecentActivityWidget />
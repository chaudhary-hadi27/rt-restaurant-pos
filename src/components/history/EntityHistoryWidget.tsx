import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useOrderHistory, useInventoryHistory, useTableHistory } from '@/lib/hooks/useHistory'
import HistoryTimeline from '@/components/history/HistoryTimeline'

export default function EntityHistoryWidget({ type, id, title }) {
    const [expanded, setExpanded] = useState(false)

    // Smart hook selection
    const hooks = {
        order: useOrderHistory,
        inventory: useInventoryHistory,
        table: useTableHistory
    }

    const { data, loading } = hooks[type]?.(id) || { data: [], loading: false }

    if (!id) return null

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-[var(--fg)]">Activity History</h3>
                        <p className="text-xs text-[var(--muted)]">{data.length} events</p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-[var(--muted)]" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--muted)]" />
                )}
            </button>

            {/* Timeline */}
            {expanded && (
                <div className="border-t border-[var(--border)] p-4 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : data.length > 0 ? (
                        <>
                            <HistoryTimeline data={data.slice(0, 5)} compact />
                            {data.length > 5 && (
                                <a
                                    href="/admin/history"
                                    className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-[var(--bg)] rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-600/10"
                                >
                                    View all {data.length} events
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-[var(--muted)] py-8 text-sm">No activity yet</p>
                    )}
                </div>
            )}
        </div>
    )
}

// Usage Examples:
// <EntityHistoryWidget type="order" id={orderId} />
// <EntityHistoryWidget type="inventory" id={itemId} />
// <EntityHistoryWidget type="table" id={tableId} />
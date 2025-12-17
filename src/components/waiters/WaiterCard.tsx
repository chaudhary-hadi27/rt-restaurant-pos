// src/components/waiters/WaiterCard.tsx

"use client";

import { Edit2, Trash2, Eye, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WaiterCardProps {
    waiter: any;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onClockToggle: () => void;
}

export default function WaiterCard({ waiter, onView, onEdit, onDelete, onClockToggle }: WaiterCardProps) {
    const router = useRouter();

    return (
        <div
            className="p-5 rounded-xl border transition-all cursor-pointer hover:shadow-xl"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            onClick={() => router.push(`/admin/waiters/${waiter.id}`)}
        >
            {/* Header with Photo */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {waiter.profile_pic ? (
                        <img src={waiter.profile_pic} alt={waiter.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg"
                             style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                            {waiter.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{waiter.name}</h3>
                        {waiter.phone && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{waiter.phone}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${waiter.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                {waiter.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* On Duty Badge */}
                {waiter.is_on_duty && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                        On Duty
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Orders</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{waiter.total_orders || 0}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Revenue</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>PKR {(waiter.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Rating</p>
                    <p className="text-lg font-bold flex items-center gap-1" style={{ color: 'var(--fg)' }}>
                        ⭐ {(waiter.avg_rating || 0).toFixed(1)}
                    </p>
                </div>
            </div>

            {/* Click to View Stats Hint */}
            <div className="mb-4 px-3 py-2 rounded-lg text-center" style={{ backgroundColor: '#3b82f610', borderLeft: '3px solid #3b82f6' }}>
                <p className="text-xs font-medium" style={{ color: '#3b82f6' }}>
                    📊 Click to view detailed statistics
                </p>
            </div>

            {/* Actions - Stop Propagation to Prevent Navigation */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Clock In/Out */}
                <button
                    onClick={onClockToggle}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                        backgroundColor: waiter.is_on_duty ? '#ef444420' : '#10b98120',
                        color: waiter.is_on_duty ? '#ef4444' : '#10b981'
                    }}
                >
                    <Clock className="w-3.5 h-3.5" />
                    {waiter.is_on_duty ? 'Clock Out' : 'Clock In'}
                </button>

                {/* Edit */}
                <button
                    onClick={onEdit}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                >
                    <Edit2 className="w-3.5 h-3.5 mx-auto" />
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                </button>
            </div>
        </div>
    );
}
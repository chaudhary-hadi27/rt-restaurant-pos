"use client";

import { Waiter } from '@/types';
import { Edit2, Trash2, Eye, Phone } from 'lucide-react';

export default function WaiterCard({
                                       waiter,
                                       onView,
                                       onEdit,
                                       onDelete
                                   }: {
    waiter: Waiter;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="p-5 rounded-lg border hover:shadow-md transition-all" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {waiter.profile_pic ? (
                        <img src={waiter.profile_pic} alt={waiter.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                            {waiter.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold" style={{ color: 'var(--fg)' }}>{waiter.name}</h3>
                        {waiter.phone && (
                            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                                <Phone className="w-3 h-3" />
                                {waiter.phone}
                            </p>
                        )}
                    </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${waiter.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Orders</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{waiter.total_orders}</p>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Revenue</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>${waiter.total_revenue.toFixed(0)}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button onClick={onView} className="flex-1 px-3 py-1.5 rounded text-sm hover:opacity-80" style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}>
                    <Eye className="w-4 h-4 mx-auto" />
                </button>
                <button onClick={onEdit} className="flex-1 px-3 py-1.5 rounded text-sm hover:opacity-80" style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}>
                    <Edit2 className="w-4 h-4 mx-auto" />
                </button>
                <button onClick={onDelete} className="flex-1 px-3 py-1.5 rounded text-sm hover:opacity-80" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                    <Trash2 className="w-4 h-4 mx-auto" />
                </button>
            </div>
        </div>
    );
}
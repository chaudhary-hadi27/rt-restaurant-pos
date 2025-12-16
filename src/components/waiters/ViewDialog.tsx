"use client";

import { Waiter } from '@/types';
import { X, Phone, Package, DollarSign, TrendingUp } from 'lucide-react';

export default function ViewDialog({ waiter, onClose }: { waiter: Waiter; onClose: () => void }) {
    const avgOrder = waiter.total_orders > 0 ? waiter.total_revenue / waiter.total_orders : 0;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-lg w-full max-w-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Waiter Details</h3>
                    <button onClick={onClose} className="p-1 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Profile */}
                    <div className="flex items-center gap-4">
                        {waiter.profile_pic ? (
                            <img src={waiter.profile_pic} alt={waiter.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                                {waiter.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h4 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{waiter.name}</h4>
                            {waiter.phone && (
                                <p className="flex items-center gap-2 mt-1" style={{ color: 'var(--muted)' }}>
                                    <Phone className="w-4 h-4" />
                                    {waiter.phone}
                                </p>
                            )}
                            <span
                                className="inline-block px-3 py-1 rounded-full text-sm font-medium mt-2"
                                style={{
                                    backgroundColor: waiter.is_active ? '#22c55e20' : '#ef444420',
                                    color: waiter.is_active ? '#22c55e' : '#ef4444'
                                }}
                            >
                                {waiter.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Orders', value: waiter.total_orders, icon: Package, color: 'var(--primary)' },
                            { label: 'Revenue', value: `$${waiter.total_revenue.toFixed(2)}`, icon: DollarSign, color: '#22c55e' },
                            { label: 'Avg/Order', value: `$${avgOrder.toFixed(2)}`, icon: TrendingUp, color: '#3b82f6' }
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                                <Icon className="w-5 h-5 mb-2" style={{ color }} />
                                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg)' }}>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: 'var(--muted)' }}>Member Since</span>
                            <span style={{ color: 'var(--fg)' }}>
                                {new Date(waiter.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: 'var(--muted)' }}>Performance</span>
                            <span style={{ color: 'var(--fg)' }}>
                                {waiter.total_orders > 50 ? 'Excellent' : waiter.total_orders > 20 ? 'Good' : 'New'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded-lg hover:opacity-90"
                        style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
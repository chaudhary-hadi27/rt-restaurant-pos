// src/components/ui/StorageInfo.tsx
'use client'

import { useState, useEffect } from 'react'
import { Database, Trash2, Download, X, HardDrive, Image, ShoppingCart } from 'lucide-react'
import { offlineManager } from '@/lib/db/offlineManager'

interface StorageData {
    used: number
    limit: number
    percentage: number
    hasData: boolean
    ordersCount: number
    menuItemsCount: number
    breakdown: {
        menu: number
        orders: number
        images: number
        total: number
    }
}

export default function StorageInfo({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [info, setInfo] = useState<StorageData | null>(null)
    const [loading, setLoading] = useState(true)
    const [clearing, setClearing] = useState(false)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        if (open) loadInfo()
    }, [open])

    const loadInfo = async () => {
        setLoading(true)
        try {
            const data = await offlineManager.getStorageInfo()
            setInfo(data)
        } catch (error) {
            console.error('Failed to load storage info:', error)
        }
        setLoading(false)
    }

    const handleClear = async () => {
        if (!confirm('🗑️ Clear order history? (Menu will be preserved)')) return

        setClearing(true)
        try {
            await offlineManager.clearAllData(false) // Keep menu
            await loadInfo()
        } catch (error) {
            console.error('Failed to clear data:', error)
        }
        setClearing(false)
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            await offlineManager.downloadEssentialData(true)
            await loadInfo()
        } catch (error) {
            console.error('Failed to sync:', error)
        }
        setSyncing(false)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--fg)]">Storage Manager</h3>
                            <p className="text-xs text-[var(--muted)]">Offline data optimization</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : info ? (
                        <>
                            {/* Total Storage */}
                            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-[var(--fg)]">Total Storage</span>
                                    <span className="text-sm font-bold text-[var(--fg)]">
                    {info.used} MB / {info.limit > 0 ? `${info.limit} MB` : '∞'}
                  </span>
                                </div>
                                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${
                                            info.percentage > 80 ? 'bg-red-600' :
                                                info.percentage > 60 ? 'bg-yellow-600' :
                                                    'bg-blue-600'
                                        }`}
                                        style={{ width: `${Math.min(info.percentage, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-[var(--muted)] mt-1">
                                    {info.percentage}% used
                                </p>
                            </div>

                            {/* Storage Breakdown */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-[var(--fg)]">Storage Breakdown</h4>

                                <div className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-[var(--fg)]">Menu Data</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">
                    {info.breakdown.menu} KB
                  </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-[var(--fg)]">Orders</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">
                    {info.breakdown.orders} KB
                  </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Image className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-[var(--fg)]">Images</span>
                                    </div>
                                    <span className="text-sm font-bold text-purple-600">
                    {info.breakdown.images} KB
                  </span>
                                </div>
                            </div>

                            {/* Data Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                                    <p className="text-xs text-[var(--muted)] mb-1">Menu Items</p>
                                    <p className="text-2xl font-bold text-[var(--fg)]">{info.menuItemsCount}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                                    <p className="text-xs text-[var(--muted)] mb-1">Orders Cached</p>
                                    <p className="text-2xl font-bold text-[var(--fg)]">{info.ordersCount}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className={`p-3 rounded-lg border ${
                                info.hasData
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-yellow-500/10 border-yellow-500/30'
                            }`}>
                                <p className="text-sm font-medium text-[var(--fg)]">
                                    {info.hasData ? '✅ Ready for offline use' : '⚠️ No offline data available'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {syncing ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>

                                <button
                                    onClick={handleClear}
                                    disabled={clearing || info.ordersCount === 0}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {clearing ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    {clearing ? 'Clearing...' : 'Clear History'}
                                </button>
                            </div>

                            {/* Info */}
                            <div className="text-xs text-[var(--muted)] space-y-1 bg-[var(--bg)] p-3 rounded-lg">
                                <p className="font-semibold text-[var(--fg)] mb-2">📌 Optimization Info:</p>
                                <p>• Menu always cached (essential data)</p>
                                <p>• Orders kept for 30 days (max 200)</p>
                                <p>• Images cached based on network</p>
                                <p>• Auto-cleanup runs daily</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-[var(--muted)]">
                            Failed to load storage info
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
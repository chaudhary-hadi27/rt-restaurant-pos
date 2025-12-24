'use client'

import { useState } from 'react'
import { Trash2, Database, AlertTriangle, Calendar, TrendingDown, CheckCircle } from 'lucide-react'

export default function AdminDataCleanup() {
    const [deleting, setDeleting] = useState(false)
    const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year' | '2years'>('6months')
    const [stats, setStats] = useState({ orders: 0, images: 0, size: 0 })
    const [loading, setLoading] = useState(false)

    const periods = {
        '3months': { label: '3 Months', days: 90, color: 'yellow' },
        '6months': { label: '6 Months', days: 180, color: 'orange' },
        '1year': { label: '1 Year', days: 365, color: 'red' },
        '2years': { label: '2 Years', days: 730, color: 'red' }
    }

    const analyzeData = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/analyze-old-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: periods[selectedPeriod].days })
            })
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Analysis failed:', error)
        }
        setLoading(false)
    }

    const deleteOldData = async () => {
        const period = periods[selectedPeriod]

        if (!confirm(`⚠️ PERMANENT DELETE\n\nThis will delete:\n• ${stats.orders} orders\n• ${stats.images} images\n• All data older than ${period.label}\n\nThis CANNOT be undone!\n\nContinue?`)) {
            return
        }

        setDeleting(true)
        try {
            const response = await fetch('/api/admin/delete-old-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: period.days })
            })

            const result = await response.json()

            if (result.success) {
                alert(`✅ Cleanup Complete!\n\n• ${result.deleted.orders} orders deleted\n• ${result.deleted.images} images removed from Cloudinary\n• ${result.deleted.size}MB freed`)
                setStats({ orders: 0, images: 0, size: 0 })
            } else {
                alert('❌ ' + result.error)
            }
        } catch (error: any) {
            alert('❌ Failed: ' + error.message)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[var(--fg)]">Data Cleanup Manager</h3>
                    <p className="text-sm text-[var(--muted)]">Permanently delete old data from Supabase + Cloudinary</p>
                </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-600 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-bold text-red-600 mb-2">⚠️ DANGER ZONE - READ CAREFULLY</p>
                        <ul className="space-y-1 text-[var(--fg)]">
                            <li>• This deletes data from Supabase & Cloudinary</li>
                            <li>• This action is PERMANENT and CANNOT be undone</li>
                            <li>• Menu items are NEVER deleted (safe)</li>
                            <li>• Only old completed orders will be removed</li>
                            <li>• Always backup important data first</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Period Selection */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--fg)] mb-3">
                    Select Data Age to Delete
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(periods).map(([key, { label, color }]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedPeriod(key as any)}
                            className={`p-4 border-2 rounded-xl transition-all ${
                                selectedPeriod === key
                                    ? `border-${color}-600 bg-${color}-600/10`
                                    : 'border-[var(--border)] hover:border-[var(--fg)]'
                            }`}
                        >
                            <Calendar className={`w-5 h-5 mb-2 ${selectedPeriod === key ? `text-${color}-600` : 'text-[var(--muted)]'}`} />
                            <p className={`font-bold text-sm ${selectedPeriod === key ? `text-${color}-600` : 'text-[var(--fg)]'}`}>
                                {label}
                            </p>
                            <p className="text-xs text-[var(--muted)]">Delete older data</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Analysis */}
            <button
                onClick={analyzeData}
                disabled={loading}
                className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                    </>
                ) : (
                    <>
                        <TrendingDown className="w-5 h-5" />
                        Analyze Data
                    </>
                )}
            </button>

            {/* Stats */}
            {stats.orders > 0 && (
                <div className="mb-6 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--fg)] mb-3">Found Old Data:</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.orders}</p>
                            <p className="text-xs text-[var(--muted)]">Orders</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{stats.images}</p>
                            <p className="text-xs text-[var(--muted)]">Images</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{stats.size}MB</p>
                            <p className="text-xs text-[var(--muted)]">Storage</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Button */}
            <button
                onClick={deleteOldData}
                disabled={deleting || stats.orders === 0}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {deleting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting Permanently...
                    </>
                ) : (
                    <>
                        <Trash2 className="w-5 h-5" />
                        Delete {stats.orders > 0 ? `${stats.orders} Orders` : 'Old Data'}
                    </>
                )}
            </button>

            {/* Safety Info */}
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[var(--fg)]">
                        <p className="font-semibold mb-1">✅ Safe Items (Never Deleted):</p>
                        <p className="text-[var(--muted)]">• Menu items & categories • Active orders • Staff data • Tables setup</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
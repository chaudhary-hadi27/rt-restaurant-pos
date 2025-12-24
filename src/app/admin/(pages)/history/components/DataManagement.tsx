// src/app/admin/(pages)/history/components/DataManagement.tsx
'use client'

import { useState } from 'react'
import { Trash2, Calendar, AlertTriangle } from 'lucide-react'
import { offlineManager } from '@/lib/db/offlineManager'
import { useToast } from '@/components/ui/Toast'

export default function DataManagement() {
    const [deleting, setDeleting] = useState(false)
    const toast = useToast()

    const handleDelete = async (type: 'monthly' | 'yearly') => {
        const period = type === 'monthly' ? '1 month' : '1 year'

        if (!confirm(`⚠️ Delete all data older than ${period}?\n\nThis will permanently remove:\n• Orders\n• Order items\n• History records\n\nMenu items will NOT be deleted.`)) {
            return
        }

        setDeleting(true)
        try {
            const result = await offlineManager.deleteOldHistory(type)

            if (result.success) {
                toast.add('success', `✅ Deleted ${result.deleted} old records (>${period})`)
            } else {
                toast.add('error', '❌ Failed to delete old data')
            }
        } catch (error: any) {
            toast.add('error', `❌ ${error.message}`)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[var(--fg)]">Data Management</h3>
                    <p className="text-sm text-[var(--muted)]">Clean up old history data</p>
                </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-[var(--fg)] mb-1">⚠️ Important</p>
                        <ul className="space-y-1 text-[var(--muted)]">
                            <li>• Orders & history will be deleted</li>
                            <li>• Menu items are NEVER deleted</li>
                            <li>• This action cannot be undone</li>
                            <li>• Backup important data first</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Delete Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly Cleanup */}
                <button
                    onClick={() => handleDelete('monthly')}
                    disabled={deleting}
                    className="p-6 border-2 border-[var(--border)] hover:border-yellow-600 hover:bg-yellow-600/10 rounded-xl transition-all group disabled:opacity-50 text-left"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-yellow-600/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-600/30 transition-colors flex-shrink-0">
                            <Calendar className="w-7 h-7 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-[var(--fg)] mb-1">Monthly Cleanup</h4>
                            <p className="text-sm text-[var(--muted)] mb-2">
                                Delete data older than 30 days
                            </p>
                            <div className="text-xs text-yellow-600 font-medium">
                                Recommended for regular maintenance
                            </div>
                        </div>
                    </div>
                </button>

                {/* Yearly Cleanup */}
                <button
                    onClick={() => handleDelete('yearly')}
                    disabled={deleting}
                    className="p-6 border-2 border-[var(--border)] hover:border-red-600 hover:bg-red-600/10 rounded-xl transition-all group disabled:opacity-50 text-left"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-red-600/20 rounded-lg flex items-center justify-center group-hover:bg-red-600/30 transition-colors flex-shrink-0">
                            <Trash2 className="w-7 h-7 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-[var(--fg)] mb-1">Yearly Cleanup</h4>
                            <p className="text-sm text-[var(--muted)] mb-2">
                                Delete data older than 1 year
                            </p>
                            <div className="text-xs text-red-600 font-medium">
                                Use for major cleanups only
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-[var(--fg)] font-medium mb-2">💡 Auto-Cleanup Info:</p>
                <ul className="text-xs text-[var(--muted)] space-y-1">
                    <li>• System auto-cleans orders older than 7 days</li>
                    <li>• Menu items are permanently cached</li>
                    <li>• Recent orders (7 days) are always kept</li>
                    <li>• Manual cleanup gives you more control</li>
                </ul>
            </div>
        </div>
    )
}
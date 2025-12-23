'use client'
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { useOfflineSync } from '@/lib/hooks/useOfflineSync'
import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
    const { isOnline, syncing, pendingCount, sync } = useOfflineSync()
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        if (isOnline && pendingCount === 0 && !syncing) {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }
    }, [isOnline, pendingCount, syncing])

    // ✅ Hide when online and no pending items (after success message)
    if (isOnline && pendingCount === 0 && !showSuccess) return null

    return (
        <div className={`fixed top-16 lg:top-0 left-0 right-0 z-40 transition-all ${
            isOnline ? (showSuccess ? 'bg-green-600' : 'bg-blue-600') : 'bg-red-600'
        } text-white`}>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                    {showSuccess ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : isOnline ? (
                        <Wifi className="w-4 h-4" />
                    ) : (
                        <WifiOff className="w-4 h-4" />
                    )}
                    <span className="font-medium">
            {syncing ? '🔄 Syncing data...' :
                showSuccess ? '✅ All synced!' :
                    isOnline ? `📤 ${pendingCount} pending` :
                        '📴 Offline - Data saved locally'}
          </span>
                </div>
                {isOnline && pendingCount > 0 && !syncing && (
                    <button
                        onClick={sync}
                        className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 flex items-center gap-1 text-xs active:scale-95"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                )}
            </div>
        </div>
    )
}
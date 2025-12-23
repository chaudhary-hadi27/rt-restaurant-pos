// src/components/ui/OfflineIndicator.tsx
'use client'
import { Wifi, WifiOff, CheckCircle, X } from 'lucide-react'
import { useOfflineSync } from '@/lib/hooks/useOfflineSync'
import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
    const { isOnline, syncing, pendingCount } = useOfflineSync()
    const [showSuccess, setShowSuccess] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (isOnline && pendingCount === 0 && !syncing) {
            setShowSuccess(true)
            setTimeout(() => {
                setShowSuccess(false)
                setDismissed(false)
            }, 3000)
        }
    }, [isOnline, pendingCount, syncing])

    // Don't show if online with no pending items
    if (isOnline && pendingCount === 0 && !showSuccess) return null
    if (dismissed) return null

    return (
        <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-top-2`}>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border backdrop-blur-sm ${
                isOnline
                    ? showSuccess
                        ? 'bg-green-600 border-green-700 text-white'
                        : 'bg-blue-600 border-blue-700 text-white'
                    : 'bg-red-600 border-red-700 text-white'
            }`}>
                {showSuccess ? (
                    <CheckCircle className="w-4 h-4" />
                ) : isOnline ? (
                    <Wifi className="w-4 h-4" />
                ) : (
                    <WifiOff className="w-4 h-4" />
                )}

                <span className="text-sm font-medium">
                    {syncing ? 'Syncing...' :
                        showSuccess ? 'All synced!' :
                            isOnline ? `${pendingCount} pending` :
                                'Offline mode'}
                </span>

                <button
                    onClick={() => setDismissed(true)}
                    className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
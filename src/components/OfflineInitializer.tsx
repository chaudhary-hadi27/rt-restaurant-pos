// src/components/OfflineInitializer.tsx - FIXED
'use client'

import { useEffect } from 'react'
import { offlineManager } from '@/lib/db/offlineManager'

export default function OfflineInitializer() {
    useEffect(() => {
        // ✅ FIX: Safe method call with existence check
        const initializeOfflineData = async () => {
            if (typeof navigator === 'undefined' || !navigator.onLine) {
                return
            }

            try {
                // ✅ Check if method exists before calling
                if (typeof offlineManager.downloadEssentialData === 'function') {
                    const result = await offlineManager.downloadEssentialData()

                    if (result?.success) {
                        console.log('✅ Offline data cached:', {
                            categories: result.counts?.categories || 0,
                            items: result.counts?.items || 0,
                            tables: result.counts?.tables || 0,
                            waiters: result.counts?.waiters || 0
                        })
                    }
                } else {
                    console.warn('⚠️ offlineManager.downloadEssentialData not available')
                }
            } catch (error) {
                console.error('❌ Failed to initialize offline data:', error)
            }
        }

        initializeOfflineData()
    }, [])

    return null
}
'use client'

import { useEffect } from 'react'
import { offlineManager } from '@/lib/db/offlineManager'

export default function OfflineInitializer() {
    useEffect(() => {
        if (navigator.onLine) {
            offlineManager.downloadEssentialData().then(result => {
                if (result.success) {
                    console.log('✅ Data cached:', result.counts)
                }
            })
        }
    }, [])

    return null
}
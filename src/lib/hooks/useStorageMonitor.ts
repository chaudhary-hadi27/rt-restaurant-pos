// src/lib/hooks/useStorageMonitor.ts - NEW FILE
'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

interface StorageStatus {
    supabase: { used: number; limit: number; percentage: number; warning: boolean }
    cloudinary: { used: number; limit: number; percentage: number; warning: boolean }
}

export function useStorageMonitor() {
    const [status, setStatus] = useState<StorageStatus | null>(null)
    const [checking, setChecking] = useState(false)
    const toast = useToast()

    useEffect(() => {
        checkStorage()
        // Check every 5 minutes
        const interval = setInterval(checkStorage, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const checkStorage = async () => {
        if (typeof window === 'undefined') return

        setChecking(true)
        try {
            // Check Supabase Storage
            const supabaseEstimate = await navigator.storage?.estimate() || { usage: 0, quota: 0 }
            const supabaseUsed = Math.round((supabaseEstimate.usage || 0) / (1024 * 1024 * 1024)) // GB
            const supabaseLimit = Math.round((supabaseEstimate.quota || 0) / (1024 * 1024 * 1024)) // GB
            const supabasePercentage = supabaseLimit > 0 ? (supabaseUsed / supabaseLimit) * 100 : 0

            // Cloudinary check (estimate based on image count)
            const cloudinaryResponse = await fetch('/api/storage/cloudinary-status')
            const cloudinaryData = await cloudinaryResponse.json()
            const cloudinaryUsed = cloudinaryData.usedGB || 0
            const cloudinaryLimit = cloudinaryData.limitGB || 25 // Free tier default
            const cloudinaryPercentage = (cloudinaryUsed / cloudinaryLimit) * 100

            const newStatus: StorageStatus = {
                supabase: {
                    used: supabaseUsed,
                    limit: supabaseLimit,
                    percentage: supabasePercentage,
                    warning: supabasePercentage > 80
                },
                cloudinary: {
                    used: cloudinaryUsed,
                    limit: cloudinaryLimit,
                    percentage: cloudinaryPercentage,
                    warning: cloudinaryPercentage > 80
                }
            }

            setStatus(newStatus)

            // Show warnings
            if (supabasePercentage > 90) {
                toast.add('error', `🚨 Supabase storage ${supabasePercentage.toFixed(0)}% full! Clean old data now.`)
            } else if (supabasePercentage > 80) {
                toast.add('warning', `⚠️ Supabase storage ${supabasePercentage.toFixed(0)}% full. Consider cleanup.`)
            }

            if (cloudinaryPercentage > 90) {
                toast.add('error', `🚨 Cloudinary storage ${cloudinaryPercentage.toFixed(0)}% full! Delete old images.`)
            } else if (cloudinaryPercentage > 80) {
                toast.add('warning', `⚠️ Cloudinary storage ${cloudinaryPercentage.toFixed(0)}% full.`)
            }

        } catch (error) {
            console.error('Storage check failed:', error)
        } finally {
            setChecking(false)
        }
    }

    return { status, checking, checkStorage }
}
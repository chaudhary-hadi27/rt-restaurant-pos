// src/app/admin/layout.tsx
"use client"

import { useEffect } from 'react'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { Shield, Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAdminAuth()

    useEffect(() => {
        // Redirect handled by hook
    }, [isAuthenticated, loading])

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-[var(--muted)]">Loading admin panel...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null // Hook will redirect to login
    }

    return <div className="min-h-screen bg-[var(--bg)]">{children}</div>
}
"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { Shield, Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { isAuthenticated, loading } = useAdminAuth()

    // ✅ FIX: Don't protect login page
    const isLoginPage = pathname.includes('/login')

    // ✅ FIX: Show loading only for protected pages
    if (loading && !isLoginPage) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-[var(--muted)]">Loading admin panel...</p>
                </div>
            </div>
        )
    }

    // ✅ FIX: Allow login page without auth
    if (!isAuthenticated && !isLoginPage) {
        return null // Hook will redirect
    }

    return <div className="min-h-screen bg-[var(--bg)]">{children}</div>
}
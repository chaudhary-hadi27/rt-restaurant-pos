"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // ✅ FIX: Check auth only after component mounts
        const checkAuth = () => {
            const auth = sessionStorage.getItem('admin_auth') === 'true'
            setIsAuthenticated(auth)
            setLoading(false)

            // ✅ FIX: Don't redirect if already on login page
            const isLoginPage = pathname.includes('/login')

            if (!auth && !isLoginPage) {
                router.push('/admin/login')
            }
        }

        checkAuth()
    }, [pathname, router])

    const login = async (password: string) => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })

            if (res.ok) {
                sessionStorage.setItem('admin_auth', 'true')
                setIsAuthenticated(true)
                return { success: true }
            }

            const data = await res.json()
            return { success: false, error: data.error || 'Invalid password' }
        } catch (error) {
            return { success: false, error: 'Network error' }
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        sessionStorage.removeItem('admin_auth')
        setIsAuthenticated(false)
        router.push('/admin/login')
    }

    return { isAuthenticated, loading, login, logout }
}
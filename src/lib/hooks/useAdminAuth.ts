// src/lib/hooks/useAdminAuth.ts
"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import bcrypt from 'bcryptjs'

export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkAuth()
    }, [pathname])

    const checkAuth = () => {
        const isLoginPage = pathname.includes('/login')

        // Check session auth
        const sessionAuth = sessionStorage.getItem('admin_auth') === 'true'

        // Check offline auth (localStorage for persistence)
        const offlineAuth = localStorage.getItem('admin_offline_auth') === 'true'

        const isAuth = sessionAuth || offlineAuth
        setIsAuthenticated(isAuth)
        setLoading(false)

        if (!isAuth && !isLoginPage) {
            router.push('/admin/login')
        }
    }

    const login = async (password: string) => {
        setLoading(true)

        try {
            // ✅ Try online authentication first
            if (navigator.onLine) {
                const res = await fetch('/api/auth/verify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                })

                if (res.ok) {
                    // Store both session and offline auth
                    sessionStorage.setItem('admin_auth', 'true')
                    localStorage.setItem('admin_offline_auth', 'true')

                    // Store hashed password for offline verification
                    const hashed = await bcrypt.hash(password, 10)
                    localStorage.setItem('admin_pwd_hash', hashed)

                    setIsAuthenticated(true)
                    return { success: true }
                }

                const data = await res.json()
                return { success: false, error: data.error || 'Invalid password' }
            }
            // ✅ Offline authentication fallback
            else {
                const storedHash = localStorage.getItem('admin_pwd_hash')

                if (!storedHash) {
                    return {
                        success: false,
                        error: 'No offline credentials. Login online first.'
                    }
                }

                const isValid = await bcrypt.compare(password, storedHash)

                if (isValid) {
                    sessionStorage.setItem('admin_auth', 'true')
                    localStorage.setItem('admin_offline_auth', 'true')
                    setIsAuthenticated(true)
                    return { success: true }
                }

                return { success: false, error: 'Invalid password' }
            }
        } catch (error) {
            // ✅ Network error - try offline auth
            const storedHash = localStorage.getItem('admin_pwd_hash')

            if (storedHash) {
                const isValid = await bcrypt.compare(password, storedHash)

                if (isValid) {
                    sessionStorage.setItem('admin_auth', 'true')
                    localStorage.setItem('admin_offline_auth', 'true')
                    setIsAuthenticated(true)
                    return { success: true }
                }
            }

            return {
                success: false,
                error: 'Network error. Login online first to enable offline access.'
            }
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        sessionStorage.removeItem('admin_auth')
        localStorage.removeItem('admin_offline_auth')
        // Keep admin_pwd_hash for future offline logins
        setIsAuthenticated(false)
        router.push('/admin/login')
    }

    return { isAuthenticated, loading, login, logout }
}
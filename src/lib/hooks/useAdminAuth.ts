"use client"
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import bcrypt from 'bcryptjs'

type AdminProfile = {
    name: string
    profile_pic?: string
}

export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<AdminProfile | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkAuth()
    }, [pathname])

    const checkAuth = () => {
        const isLoginPage = pathname.includes('/login')
        const sessionAuth = sessionStorage.getItem('admin_auth') === 'true'
        const offlineAuth = localStorage.getItem('admin_offline_auth') === 'true'
        const isAuth = sessionAuth || offlineAuth

        // Load profile from localStorage
        const storedProfile = localStorage.getItem('admin_profile')
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile))
        }

        setIsAuthenticated(isAuth)
        setLoading(false)

        if (!isAuth && !isLoginPage) {
            router.push('/admin/login')
        }
    }

    const login = async (password: string) => {
        setLoading(true)

        try {
            if (navigator.onLine) {
                const res = await fetch('/api/auth/verify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                })

                if (res.ok) {
                    const data = await res.json()

                    // Store auth
                    sessionStorage.setItem('admin_auth', 'true')
                    localStorage.setItem('admin_offline_auth', 'true')

                    // Store profile
                    if (data.profile) {
                        localStorage.setItem('admin_profile', JSON.stringify(data.profile))
                        setProfile(data.profile)
                    }

                    const hashed = await bcrypt.hash(password, 10)
                    localStorage.setItem('admin_pwd_hash', hashed)

                    setIsAuthenticated(true)
                    return { success: true }
                }

                const data = await res.json()
                return { success: false, error: data.error || 'Invalid password' }
            } else {
                const storedHash = localStorage.getItem('admin_pwd_hash')
                if (!storedHash) {
                    return { success: false, error: 'No offline credentials. Login online first.' }
                }

                const isValid = await bcrypt.compare(password, storedHash)
                if (isValid) {
                    sessionStorage.setItem('admin_auth', 'true')
                    localStorage.setItem('admin_offline_auth', 'true')

                    // Load offline profile
                    const storedProfile = localStorage.getItem('admin_profile')
                    if (storedProfile) setProfile(JSON.parse(storedProfile))

                    setIsAuthenticated(true)
                    return { success: true }
                }

                return { success: false, error: 'Invalid password' }
            }
        } catch (error) {
            const storedHash = localStorage.getItem('admin_pwd_hash')
            if (storedHash) {
                const isValid = await bcrypt.compare(password, storedHash)
                if (isValid) {
                    sessionStorage.setItem('admin_auth', 'true')
                    localStorage.setItem('admin_offline_auth', 'true')

                    const storedProfile = localStorage.getItem('admin_profile')
                    if (storedProfile) setProfile(JSON.parse(storedProfile))

                    setIsAuthenticated(true)
                    return { success: true }
                }
            }

            return { success: false, error: 'Network error. Login online first to enable offline access.' }
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = (newProfile: AdminProfile) => {
        setProfile(newProfile)
        localStorage.setItem('admin_profile', JSON.stringify(newProfile))
    }

    const logout = () => {
        sessionStorage.removeItem('admin_auth')
        localStorage.removeItem('admin_offline_auth')
        setIsAuthenticated(false)
        setProfile(null)
        router.push('/admin/login')
    }

    return { isAuthenticated, loading, profile, login, logout, updateProfile }
}
// src/lib/hooks/useAdminAuth.ts
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AdminUser {
    id: string
    name: string
    email: string
    role: 'admin' | 'super_admin'
    permissions: Record<string, boolean>
    profile_pic?: string
}

export function useAdminAuth() {
    const [admin, setAdmin] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const sessionData = sessionStorage.getItem('admin_session')
            if (!sessionData) {
                setLoading(false)
                return
            }

            const { adminId, token } = JSON.parse(sessionData)

            // Verify session with backend
            const response = await fetch('/api/auth/verify-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId, token })
            })

            if (!response.ok) throw new Error('Session invalid')

            const { data: adminData } = await supabase
                .from('admins')
                .select('id, name, email, role, permissions, profile_pic')
                .eq('id', adminId)
                .eq('is_active', true)
                .single()

            if (adminData) {
                setAdmin(adminData)
            } else {
                logout()
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            // Store session
            sessionStorage.setItem('admin_session', JSON.stringify({
                adminId: data.admin.id,
                token: data.token
            }))

            setAdmin(data.admin)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    const logout = () => {
        sessionStorage.removeItem('admin_session')
        setAdmin(null)
        router.push('/admin/login')
    }

    const hasPermission = (permission: string) => {
        if (!admin) return false
        if (admin.role === 'super_admin') return true
        return admin.permissions?.[permission] === true
    }

    return {
        admin,
        loading,
        isAuthenticated: !!admin,
        login,
        logout,
        hasPermission,
        refresh: checkAuth
    }
}
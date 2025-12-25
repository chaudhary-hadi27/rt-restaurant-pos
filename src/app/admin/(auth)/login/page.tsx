// src/app/admin/(auth)/login/page.tsx - COMPLETE REDESIGN
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Eye, EyeOff, AlertCircle, Wifi, WifiOff, Moon, Sun, ArrowLeft } from 'lucide-react'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { useTheme } from '@/lib/store/theme-store'

export default function AdminLoginPage() {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isOnline, setIsOnline] = useState(true)
    const { login } = useAdminAuth()
    const { theme, toggleTheme } = useTheme()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        setIsOnline(navigator.onLine)
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const handleSubmit = async () => {
        setError('')
        setLoading(true)
        const result = await login(password)
        if (result.success) {
            router.push('/admin')
        } else {
            setError(result.error || 'Invalid password')
        }
        setLoading(false)
    }

    if (!mounted) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg)]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[var(--bg)] via-[var(--card)] to-[var(--bg)] p-4 relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            {/* Theme Toggle - Top Right */}
            <button onClick={toggleTheme} className="fixed top-4 right-4 z-50 p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-blue-600 transition-all shadow-lg active:scale-95">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>

            {/* Back Button */}
            <button onClick={() => router.push('/')} className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-blue-600 transition-all shadow-lg active:scale-95 text-sm font-medium text-[var(--fg)]">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
            </button>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl mb-4 relative">
                        <Shield className="w-10 h-10 text-white" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[var(--bg)] flex items-center justify-center">
                            {isOnline ? <Wifi className="w-3 h-3 text-white" /> : <WifiOff className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">Admin Panel</h1>
                    <p className="text-sm text-[var(--muted)]">RT Restaurant Management System</p>
                    <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs font-medium border ${isOnline ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'}`}>
                        {isOnline ? <><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Online Mode</> : <><div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />Offline Mode</>}
                    </div>
                </div>

                <div className="bg-[var(--card)] border-2 border-[var(--border)] rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-600">{error}</p>
                                    {!isOnline && <p className="text-xs text-red-500 mt-2">💡 Login online once to enable offline access</p>}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-[var(--fg)] mb-3">Admin Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-5 h-5 text-[var(--muted)]" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Enter your password"
                                    autoFocus
                                    className="w-full pl-12 pr-12 py-4 text-base bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-2 ml-1">Enter your admin password to access the dashboard</p>
                        </div>

                        <button onClick={handleSubmit} disabled={loading || !password} className="w-full py-4 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 active:scale-95 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Access Dashboard
                                </span>
                            )}
                        </button>

                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--fg)] mb-1">Security Notice</p>
                                    <p className="text-xs text-[var(--muted)] leading-relaxed">Login online once to enable offline access. Your session will remain active for 8 hours.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-[var(--muted)]">© 2025 RT Restaurant. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Eye, EyeOff, AlertCircle, Moon, Sun } from 'lucide-react'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { useTheme } from '@/lib/store/theme-store'

export default function AdminLoginPage() {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAdminAuth()
    const { theme, toggleTheme } = useTheme()
    const router = useRouter()

    // ✅ FIX: Hydration state
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 relative">
            {/* ✅ Theme Toggle Button - Top Right */}
            {mounted && (
                <button
                    onClick={toggleTheme}
                    className="fixed top-4 right-4 z-50 p-3 rounded-full bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--bg)] transition-all shadow-lg"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-blue-600" />
                    )}
                </button>
            )}

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">Admin Panel</h1>
                    <p className="text-[var(--muted)]">Enter password to access dashboard</p>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                                Admin Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    required
                                    autoFocus
                                    className="w-full pl-11 pr-12 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 active:scale-95"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                'Access Dashboard'
                            )}
                        </button>
                    </form>
                </div>

                {/* Demo Password - Only in Development */}
                {mounted && process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg animate-in slide-in-from-bottom-2">
                        <p className="text-sm text-blue-600 font-medium mb-2">🔑 Demo Password:</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-blue-600/20 px-3 py-1.5 rounded text-blue-600 font-mono">
                                admin123
                            </code>
                            <button
                                onClick={() => setPassword('admin123')}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                                Use
                            </button>
                        </div>
                    </div>
                )}

                {/* Back to Restaurant */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                    >
                        ← Back to Restaurant
                    </button>
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import Sidebar from '@/components/layout/sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [auth, setAuth] = useState(false)
    const [pwd, setPwd] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setAuth(sessionStorage.getItem('admin_auth') === 'true')
    }, [])

    const handleAuth = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            })

            if (res.ok) {
                sessionStorage.setItem('admin_auth', 'true')
                setAuth(true)
            } else {
                alert('Invalid password')
            }
        } catch {
            alert('Auth failed')
        }
        setLoading(false)
    }

    if (!auth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                <div className="w-full max-w-md p-8 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-[var(--fg)] mb-2">Admin Access</h2>
                    <p className="text-center text-[var(--muted)] mb-6">Enter password</p>
                    <Input
                        type="password"
                        value={pwd}
                        onChange={(e: any) => setPwd(e.target.value)}
                        onKeyDown={(e: any) => e.key === 'Enter' && handleAuth()}
                        className="mb-4"
                    />
                    <Button onClick={handleAuth} disabled={loading} className="w-full">
                        {loading ? 'Verifying...' : 'Access Panel'}
                    </Button>
                    <p className="text-xs text-center text-[var(--muted)] mt-4">Default: admin123</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <Sidebar />
            <main className="lg:ml-16 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    )
}
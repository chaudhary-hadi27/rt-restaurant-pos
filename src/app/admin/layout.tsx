// src/app/admin/layout.tsx
"use client";

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuth, setIsAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if already authenticated (stored in sessionStorage)
    useEffect(() => {
        const auth = sessionStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuth(true);
        }
    }, []);

    const handleAuth = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                sessionStorage.setItem('admin_auth', 'true');
                setIsAuth(true);
            } else {
                setError('Invalid password');
            }
        } catch (err) {
            setError('Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    // Password Gate Screen
    if (!isAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
                <div className="w-full max-w-md rounded-xl p-8 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                        <Shield className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--fg)' }}>
                        Admin Access Required
                    </h2>
                    <p className="text-center mb-6" style={{ color: 'var(--muted)' }}>
                        Enter password to access admin panel
                    </p>

                    <input
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        className="w-full px-4 py-3 rounded-lg border mb-4 focus:outline-none"
                        style={{
                            backgroundColor: 'var(--bg)',
                            borderColor: error ? '#ef4444' : 'var(--border)',
                            color: 'var(--fg)'
                        }}
                    />

                    {error && (
                        <p className="text-sm mb-4 text-center" style={{ color: '#ef4444' }}>
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={loading || !password}
                        className="w-full py-3 rounded-lg font-medium disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        {loading ? 'Verifying...' : 'Access Admin Panel'}
                    </button>

                    <p className="text-xs text-center mt-4" style={{ color: 'var(--muted)' }}>
                        Default password: <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--hover-bg)' }}>admin123</code>
                    </p>
                </div>
            </div>
        );
    }

    // Authenticated - Show Admin Layout
    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
            <Sidebar />
            <main className="lg:ml-[64px] transition-all duration-300">
                <div className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
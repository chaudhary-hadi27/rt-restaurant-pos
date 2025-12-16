// src/components/inventory/PasswordGate.tsx

"use client";

import { useState } from 'react';
import { Package } from 'lucide-react';

interface PasswordGateProps {
    onAuthenticated: () => void;
}

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                onAuthenticated();
            } else {
                alert('Invalid password');
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md rounded-xl p-8 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                    <Package className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--fg)' }}>Inventory Access</h2>
                <p className="text-center mb-6" style={{ color: 'var(--muted)' }}>Enter password to continue</p>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    className="w-full px-4 py-3 rounded-lg border mb-4 focus:outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                />
                <button
                    onClick={handleAuth}
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                >
                    {loading ? 'Verifying...' : 'Access Inventory'}
                </button>
            </div>
        </div>
    );
}
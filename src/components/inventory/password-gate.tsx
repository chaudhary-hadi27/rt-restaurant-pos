"use client";

import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
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
                setError('Invalid password');
            }
        } catch {
            setError('Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl p-6 md:p-8 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}>
                        <Lock className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-center mb-2" style={{ color: 'var(--fg)' }}>
                        Inventory Access
                    </h2>
                    <p className="text-sm md:text-base text-center mb-6" style={{ color: 'var(--muted)' }}>
                        Enter admin password to continue
                    </p>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                            style={{
                                backgroundColor: 'var(--bg)',
                                borderColor: 'var(--border)',
                                color: 'var(--fg)'
                            }}
                            autoFocus
                        />

                        {error && (
                            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !password}
                            className="w-full py-3 rounded-lg transition-opacity disabled:opacity-50 text-sm md:text-base"
                            style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                        >
                            {loading ? 'Verifying...' : 'Access Inventory'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
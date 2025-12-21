'use client'

import { useState } from 'react'
import { Key, Save, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import ResponsiveInput from '@/components/ui/ResponsiveInput'

export default function SettingsPage() {
    const [form, setForm] = useState({ current: '', new: '', confirm: '' })
    const [loading, setLoading] = useState(false)
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
    const toast = useToast()

    const handleReset = async () => {
        if (!form.current || !form.new || !form.confirm) {
            return toast.add('error', 'All fields required')
        }
        if (form.new !== form.confirm) {
            return toast.add('error', 'New passwords do not match')
        }
        if (form.new.length < 8) {
            return toast.add('error', 'Password must be at least 8 characters')
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: form.current, newPassword: form.new })
            })

            const data = await res.json()
            if (res.ok) {
                toast.add('success', '✅ Password updated successfully!')
                setForm({ current: '', new: '', confirm: '' })
            } else {
                toast.add('error', data.error || 'Failed to update')
            }
        } catch (error) {
            toast.add('error', 'Network error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <PageHeader title="Admin Settings" subtitle="Manage your admin account" />

            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
                            <Key className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--fg)]">Reset Password</h2>
                            <p className="text-sm text-[var(--muted)]">Change your admin password</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <ResponsiveInput
                                label="Current Password"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={form.current}
                                onChange={e => setForm({ ...form, current: e.target.value })}
                                placeholder="Enter current password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-3 top-9 text-[var(--muted)]"
                            >
                                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="relative">
                            <ResponsiveInput
                                label="New Password"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={form.new}
                                onChange={e => setForm({ ...form, new: e.target.value })}
                                placeholder="Enter new password (min 8 chars)"
                                required
                                hint="Must be at least 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-3 top-9 text-[var(--muted)]"
                            >
                                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="relative">
                            <ResponsiveInput
                                label="Confirm New Password"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={form.confirm}
                                onChange={e => setForm({ ...form, confirm: e.target.value })}
                                placeholder="Re-enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-3 top-9 text-[var(--muted)]"
                            >
                                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Update Password
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
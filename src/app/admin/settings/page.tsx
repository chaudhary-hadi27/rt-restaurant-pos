'use client'

import { useState, useEffect } from 'react'
import { Phone, Mail, Lock, Save } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function Settings() {
    const [form, setForm] = useState({ phone: '', email: '', currentPwd: '', newPwd: '' })
    const [loading, setLoading] = useState(false)
    const toast = useToast()

    useEffect(() => {
        fetch('/api/auth/settings').then(r => r.json()).then(d =>
            setForm(prev => ({ ...prev, phone: d.phone || '', email: d.email || '' }))
        )
    }, [])

    const save = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/update-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                toast.add('success', '✅ Settings updated!')
                setForm(prev => ({ ...prev, currentPwd: '', newPwd: '' }))
            } else {
                const err = await res.json()
                toast.add('error', err.error)
            }
        } catch {
            toast.add('error', 'Update failed')
        } finally {
            setLoading(false)
        }
    }

    const Input = ({ icon: Icon, label, ...props }: any) => (
        <div>
            <label className="block text-sm font-medium text-[var(--fg)] mb-2">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-3 w-5 h-5 text-[var(--muted)]" />
                <input
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                    {...props}
                />
            </div>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--fg)]">Settings</h1>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <Input icon={Phone} label="Phone" type="tel" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
                <Input icon={Mail} label="Email" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
                <Input icon={Lock} label="Current Password" type="password" value={form.currentPwd} onChange={(e: any) => setForm({ ...form, currentPwd: e.target.value })} />
                <Input icon={Lock} label="New Password" type="password" value={form.newPwd} onChange={(e: any) => setForm({ ...form, newPwd: e.target.value })} />

                <button
                    onClick={save}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
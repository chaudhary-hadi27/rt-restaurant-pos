"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

const PERMS = ['inventory', 'waiters', 'tables', 'orders', 'analytics', 'settings']

export default function UsersPage() {
    const [admins, setAdmins] = useState<any[]>([])
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'admin', permissions: {} as any })
    const supabase = createClient()

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false })
        setAdmins(data || [])
    }

    const save = async () => {
        const data = {
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            role: form.role,
            permissions: form.permissions,
            is_active: true
        }

        if (modal?.id) {
            await supabase.from('admins').update(data).eq('id', modal.id)
        } else {
            await supabase.from('admins').insert({ ...data, password_hash: `hashed_${form.password}` })
        }

        setModal(null)
        setForm({ name: '', email: '', phone: '', password: '', role: 'admin', permissions: {} })
        load()
    }

    const del = async (id: string) => {
        if (confirm('Delete this admin?')) {
            await supabase.from('admins').delete().eq('id', id)
            load()
        }
    }

    const togglePerm = (key: string) => {
        setForm({ ...form, permissions: { ...form.permissions, [key]: !form.permissions[key] } })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Admin Users</h1>
                    <p className="text-sm text-[var(--muted)]">{admins.length} admins</p>
                </div>
                <Button onClick={() => { setModal({}); setForm({ name: '', email: '', phone: '', password: '', role: 'admin', permissions: {} }) }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Admin
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {admins.map(a => (
                    <div key={a.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                {a.name[0]}
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--fg)]">{a.name}</h3>
                                <p className="text-xs text-[var(--muted)]">{a.email}</p>
                            </div>
                            <span className={`ml-auto px-2 py-1 rounded-md text-xs font-medium ${a.role === 'super_admin' ? 'bg-blue-500/20 text-blue-600' : 'bg-gray-500/20 text-gray-600'}`}>
                {a.role === 'super_admin' ? 'Super' : 'Admin'}
              </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                            {PERMS.map(p => (
                                <span key={p} className={`px-2 py-1 rounded-md text-xs ${a.permissions?.[p] ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-600'}`}>
                  {p}
                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => { setModal(a); setForm({ name: a.name, email: a.email, phone: a.phone, password: '', role: a.role, permissions: a.permissions || {} }) }} className="text-blue-600 text-sm">Edit</button>
                            <button onClick={() => del(a.id)} className="text-red-600 text-sm">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal?.id ? 'Edit Admin' : 'Add Admin'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
                        <Button onClick={save} className="flex-1">Save</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input label="Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Email" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
                    <Input label="Phone" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
                    {!modal?.id && <Input label="Password" type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} />}

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-[var(--fg)]">Role</label>
                        <select
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)]"
                        >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>

                    {form.role === 'admin' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--fg)]">Permissions</label>
                            <div className="grid grid-cols-2 gap-2">
                                {PERMS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => togglePerm(p)}
                                        className={`p-2 rounded-lg border text-sm capitalize ${form.permissions[p] ? 'bg-green-500/20 border-green-500 text-green-600' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--fg)]'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}
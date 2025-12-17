// ============================================
// FILE: src/app/admin/waiters/page.tsx
// Professional, Clean, Theme-Consistent UI
// ============================================
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { uploadToCloudinary } from '@/lib/utils/cloudinary'
import { Plus, Search, Edit2, Trash2, X, Upload, Phone, TrendingUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

export default function WaitersPage() {
    const router = useRouter()
    const { data: waiters, loading, insert, update, remove } = useSupabase('waiters', {
        order: { column: 'created_at', ascending: false },
        realtime: true
    })

    const [search, setSearch] = useState('')
    const [editModal, setEditModal] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        phone: '',
        employee_type: 'waiter',
        cnic: '',
        profile_pic: ''
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const url = await uploadToCloudinary(file)
            setForm({ ...form, profile_pic: url })
        } catch (error) {
            alert('Upload failed')
        }
        setUploading(false)
    }

    const openEdit = (waiter?: any) => {
        if (waiter) {
            setForm({
                name: waiter.name,
                phone: waiter.phone || '',
                employee_type: waiter.employee_type || 'waiter',
                cnic: waiter.cnic || '',
                profile_pic: waiter.profile_pic || ''
            })
        } else {
            setForm({ name: '', phone: '', employee_type: 'waiter', cnic: '', profile_pic: '' })
        }
        setEditModal(waiter || {})
    }

    const save = async () => {
        if (!form.name || !form.phone) {
            alert('Name and phone required')
            return
        }

        const data = {
            name: form.name,
            phone: form.phone,
            employee_type: form.employee_type,
            cnic: form.cnic || null,
            profile_pic: form.profile_pic || null,
            is_active: true,
            total_orders: 0,
            total_revenue: 0
        }

        if (editModal?.id) {
            await update(editModal.id, data)
        } else {
            await insert(data)
        }
        setEditModal(null)
    }

    const deleteWaiter = async (id: string) => {
        if (confirm('Delete this waiter?')) {
            await remove(id)
        }
    }

    const filtered = waiters.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.phone?.includes(search)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Staff Management</h1>
                    <p className="text-sm text-[var(--muted)] mt-1">{waiters.length} employees</p>
                </div>
                <Button onClick={() => openEdit()}>
                    <Plus className="w-4 h-4 mr-2" /> Add Staff
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
            </div>

            {/* Waiters Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Staff</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Contact</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Type</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Performance</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                        {filtered.map(waiter => (
                            <tr
                                key={waiter.id}
                                onClick={() => router.push(`/admin/waiters/${waiter.id}`)}
                                className="hover:bg-[var(--bg)] transition-colors cursor-pointer group"
                            >
                                {/* Staff Info */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        {waiter.profile_pic ? (
                                            <img
                                                src={waiter.profile_pic}
                                                alt={waiter.name}
                                                className="w-10 h-10 rounded-full object-cover border border-[var(--border)]"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                                {waiter.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-[var(--fg)] group-hover:text-blue-600 transition-colors">
                                                {waiter.name}
                                            </p>
                                            {waiter.cnic && (
                                                <p className="text-xs text-[var(--muted)]">{waiter.cnic}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Contact */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                        <Phone className="w-4 h-4" />
                                        <span>{waiter.phone}</span>
                                    </div>
                                </td>

                                {/* Employee Type */}
                                <td className="px-4 py-4">
                                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg)] text-[var(--fg)] capitalize">
                                        {waiter.employee_type}
                                    </span>
                                </td>

                                {/* Performance */}
                                <td className="px-4 py-4">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-[var(--fg)]">
                                            {waiter.total_orders || 0} orders
                                        </p>
                                        <p className="text-xs text-[var(--muted)]">
                                            PKR {(waiter.total_revenue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </td>

                                {/* Actions - Stop propagation to prevent row click */}
                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/waiters/${waiter.id}`)}
                                            className="p-2 hover:bg-blue-600/10 rounded-lg transition-colors group/btn"
                                            title="View Stats"
                                        >
                                            <TrendingUp className="w-4 h-4 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => openEdit(waiter)}
                                            className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors group/btn"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4 text-[var(--muted)] group-hover/btn:text-[var(--fg)]" />
                                        </button>
                                        <button
                                            onClick={() => deleteWaiter(waiter.id)}
                                            className="p-2 hover:bg-red-600/10 rounded-lg transition-colors group/btn"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-[var(--muted)] group-hover/btn:text-red-600" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-[var(--muted)]">No staff found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                open={!!editModal}
                onClose={() => setEditModal(null)}
                title={editModal?.id ? 'Edit Staff' : 'Add Staff'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditModal(null)} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={save} className="flex-1" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Save'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                            Profile Picture
                        </label>
                        <div className="flex items-center gap-4">
                            {form.profile_pic ? (
                                <div className="relative">
                                    <img
                                        src={form.profile_pic}
                                        alt="Preview"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border)]"
                                    />
                                    <button
                                        onClick={() => setForm({ ...form, profile_pic: '' })}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-[var(--bg)] border-2 border-dashed border-[var(--border)] flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-[var(--muted)]" />
                                </div>
                            )}
                            <label className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--fg)] cursor-pointer hover:bg-[var(--card)] transition-colors">
                                {uploading ? 'Uploading...' : 'Choose Photo'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Name */}
                    <Input
                        label="Full Name"
                        value={form.name}
                        onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter full name"
                    />

                    {/* Employee Type */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                            Employee Type
                        </label>
                        <select
                            value={form.employee_type}
                            onChange={e => setForm({ ...form, employee_type: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="waiter">Waiter</option>
                            <option value="chef">Chef</option>
                            <option value="manager">Manager</option>
                            <option value="cashier">Cashier</option>
                            <option value="cleaner">Cleaner</option>
                        </select>
                    </div>

                    {/* Phone */}
                    <Input
                        label="Phone Number"
                        type="tel"
                        value={form.phone}
                        onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                    />

                    {/* CNIC */}
                    <Input
                        label="CNIC (Optional)"
                        value={form.cnic}
                        onChange={(e: any) => setForm({ ...form, cnic: e.target.value })}
                        placeholder="12345-1234567-1"
                    />
                </div>
            </Modal>
        </div>
    )
}
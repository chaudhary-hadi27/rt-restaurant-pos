"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Admin } from '@/types';
import { Shield, Plus, Edit2, Trash2, UserX, UserCheck, X, Eye, EyeOff } from 'lucide-react';

const PERMISSIONS = [
    { key: 'inventory', label: 'Inventory' },
    { key: 'waiters', label: 'Waiters' },
    { key: 'tables', label: 'Tables' },
    { key: 'orders', label: 'Orders' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'settings', label: 'Settings' }
];

export default function AdminPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | null; admin?: Admin }>({ type: null });
    const [loading, setLoading] = useState(true);
    const [currentUser] = useState({ id: 'super-users-id', role: 'super_admin' });

    const supabase = createClient();

    useEffect(() => {
        loadAdmins();
        const channel = supabase.channel('admin_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, () => loadAdmins()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
        setAdmins(data || []);
        setLoading(false);
    };

    const handleSubmit = async (formData: any) => {
        try {
            const data = {
                email: formData.email.trim(),
                name: formData.name.trim(),
                phone: formData.phone?.trim() || null,
                role: formData.role,
                permissions: formData.permissions,
                password_hash: formData.password ? `hashed_${formData.password}` : undefined,
                is_active: true
            };

            if (dialog.type === 'edit' && dialog.admin) {
                const { password_hash, ...updateData } = data;
                await supabase.from('admins').update(updateData).eq('id', dialog.admin.id);
            } else {
                await supabase.from('admins').insert(data);
            }
            setDialog({ type: null });
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async () => {
        if (!dialog.admin) return;
        await supabase.from('admins').delete().eq('id', dialog.admin.id);
        setDialog({ type: null });
    };

    const toggleStatus = async (admin: Admin) => {
        await supabase.from('admins').update({ is_active: !admin.is_active }).eq('id', admin.id);
    };

    const stats = {
        total: admins.length,
        active: admins.filter(a => a.is_active).length,
        superAdmins: admins.filter(a => a.role === 'super_admin').length
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>Admin Management</h1>
                    <p className="mt-1" style={{ color: 'var(--muted)' }}>Manage users and permissions</p>
                </div>
                <button onClick={() => setDialog({ type: 'add' })} className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                    <Plus className="w-5 h-5" />
                    <span>Add Admin</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Active" value={stats.active} />
                <StatCard label="Super Admins" value={stats.superAdmins} />
            </div>

            {loading ? (
                <div className="rounded-xl p-8 text-center border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <p style={{ color: 'var(--muted)' }}>Loading...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {admins.map(admin => (
                        <AdminCard key={admin.id} admin={admin} onEdit={() => setDialog({ type: 'edit', admin })} onDelete={() => setDialog({ type: 'delete', admin })} onToggleStatus={() => toggleStatus(admin)} isSuperAdmin={currentUser.role === 'super_admin'} />
                    ))}
                </div>
            )}

            {(dialog.type === 'add' || dialog.type === 'edit') && <AdminDialog admin={dialog.admin} onClose={() => setDialog({ type: null })} onSubmit={handleSubmit} />}
            {dialog.type === 'delete' && dialog.admin && <DeleteDialog admin={dialog.admin} onClose={() => setDialog({ type: null })} onDelete={handleDelete} />}
        </div>
    );
}

interface AdminCardProps {
    admin: Admin;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
    isSuperAdmin: boolean;
}

function AdminCard({ admin, onEdit, onDelete, onToggleStatus, isSuperAdmin }: AdminCardProps) {
    const activePerms = Object.entries(admin.permissions || {}).filter(([_, v]) => v).length;

    return (
        <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        {admin.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold" style={{ color: 'var(--fg)' }}>{admin.name}</h3>
                            {!admin.is_active && <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: '#ef444420', color: 'var(--danger)' }}>Inactive</span>}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{admin.email}</p>
                    </div>
                </div>
                <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: admin.role === 'super_admin' ? 'var(--accent-subtle)' : '#71717a20', color: admin.role === 'super_admin' ? 'var(--accent)' : 'var(--muted)' }}>
          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
        </span>
            </div>

            <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Permissions ({activePerms}/{PERMISSIONS.length})</p>
                <div className="flex flex-wrap gap-1">
                    {PERMISSIONS.map(perm => {
                        const hasPermission = admin.permissions?.[perm.key];
                        return (
                            <span key={perm.key} className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: hasPermission ? '#10b98120' : '#71717a20', color: hasPermission ? 'var(--success)' : 'var(--muted)' }}>
                {perm.label}
              </span>
                        );
                    })}
                </div>
            </div>

            {isSuperAdmin && admin.role !== 'super_admin' && (
                <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={onToggleStatus} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: admin.is_active ? '#ef444420' : '#10b98120', color: admin.is_active ? 'var(--danger)' : 'var(--success)' }}>
                        {admin.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        {admin.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={onEdit} className="px-3 py-2 rounded-lg" style={{ color: 'var(--accent)' }}>
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="px-3 py-2 rounded-lg" style={{ color: 'var(--danger)' }}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

interface AdminDialogProps {
    admin?: Admin;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

function AdminDialog({ admin, onClose, onSubmit }: AdminDialogProps) {
    const [form, setForm] = useState({
        name: admin?.name || '',
        email: admin?.email || '',
        phone: admin?.phone || '',
        password: '',
        role: admin?.role || 'admin',
        permissions: admin?.permissions || PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: p.key !== 'settings' }), {})
    });
    const [showPassword, setShowPassword] = useState(false);

    const togglePermission = (key: string) => {
        setForm({ ...form, permissions: { ...form.permissions, [key]: !form.permissions[key] } });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="rounded-xl w-full max-w-2xl border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-6 border-b sticky top-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>{admin ? 'Edit' : 'Add'} Admin</h3>
                    <button onClick={onClose} style={{ color: 'var(--muted)' }}><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                        <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                        {!admin && (
                            <div className="relative">
                                <Input label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9" style={{ color: 'var(--muted)' }}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium" style={{ color: 'var(--fg)' }}>Role</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['admin', 'super_admin'].map(role => (
                                <button key={role} onClick={() => setForm({ ...form, role })} className="p-3 rounded-lg border text-left" style={{ borderColor: form.role === role ? 'var(--accent)' : 'var(--border)', backgroundColor: form.role === role ? 'var(--accent-subtle)' : 'transparent', color: 'var(--fg)' }}>
                                    <div className="font-medium">{role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
                                    <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{role === 'super_admin' ? 'Full access' : 'Limited'}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.role === 'admin' && (
                        <div className="space-y-4">
                            <h4 className="font-medium" style={{ color: 'var(--fg)' }}>Permissions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {PERMISSIONS.map(perm => (
                                    <button key={perm.key} onClick={() => togglePermission(perm.key)} className="p-3 rounded-lg border text-left" style={{ borderColor: form.permissions[perm.key] ? 'var(--success)' : 'var(--border)', backgroundColor: form.permissions[perm.key] ? '#10b98120' : 'transparent' }}>
                                        <span className="font-medium" style={{ color: 'var(--fg)' }}>{perm.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 p-6 border-t sticky bottom-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                    <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg" style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>Cancel</button>
                    <button onClick={() => onSubmit(form)} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>{admin ? 'Save' : 'Create'}</button>
                </div>
            </div>
        </div>
    );
}

interface DeleteDialogProps {
    admin: Admin;
    onClose: () => void;
    onDelete: () => void;
}

function DeleteDialog({ admin, onClose, onDelete }: DeleteDialogProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#ef444420' }}>
                        <Shield className="w-6 h-6" style={{ color: 'var(--danger)' }} />
                    </div>
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--fg)' }}>Delete {admin.name}?</p>
                    <p style={{ color: 'var(--muted)' }}>This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg" style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>Cancel</button>
                    <button onClick={onDelete} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>Delete</button>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: number;
}

function StatCard({ label, value }: StatCardProps) {
    return (
        <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>{value}</p>
        </div>
    );
}

interface InputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}

function Input({ label, value, onChange, type = 'text', required = false }: InputProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-4 py-2 rounded-lg border focus:outline-none" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
        </div>
    );
}
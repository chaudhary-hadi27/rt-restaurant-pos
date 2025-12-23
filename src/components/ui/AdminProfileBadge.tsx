'use client'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { Shield } from 'lucide-react'

export default function AdminProfileBadge() {
    const { profile } = useAdminAuth()

    if (!profile) return null

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
            {profile.profile_pic ? (
                <img
                    src={profile.profile_pic}
                    alt={profile.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-600"
                />
            ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-[var(--fg)]">
                {profile.name}
            </span>
        </div>
    )
}
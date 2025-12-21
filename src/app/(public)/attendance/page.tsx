'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Timer, LogIn, LogOut, User } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'

export default function AttendancePage() {
    const [waiters, setWaiters] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => { load() }, [])

    const load = async () => {
        const { data } = await supabase.from('waiters').select('*').eq('is_active', true).order('name')
        setWaiters(data || [])
    }

    const handleClockIn = async (waiterId: string) => {
        setLoading(true)
        try {
            await supabase.from('waiter_shifts').insert({ waiter_id: waiterId, clock_in: new Date().toISOString() })
            await supabase.from('waiters').update({ is_on_duty: true }).eq('id', waiterId)
            toast.add('success', '✅ Clocked in!')
            load()
        } catch (error) {
            toast.add('error', '❌ Failed')
        }
        setLoading(false)
    }

    const handleClockOut = async (waiterId: string) => {
        setLoading(true)
        try {
            const { data: shift } = await supabase.from('waiter_shifts').select('id').eq('waiter_id', waiterId).is('clock_out', null).single()
            if (shift) {
                await supabase.from('waiter_shifts').update({ clock_out: new Date().toISOString() }).eq('id', shift.id)
                await supabase.from('waiters').update({ is_on_duty: false }).eq('id', waiterId)
                toast.add('success', '✅ Clocked out!')
                load()
            }
        } catch (error) {
            toast.add('error', '❌ Failed')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <PageHeader title="Attendance" subtitle="Mark your presence" />

            <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 space-y-4">
                {waiters.map(waiter => (
                    <div key={waiter.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 sm:p-6 flex items-center justify-between gap-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {waiter.profile_pic ? (
                                <img src={waiter.profile_pic} alt={waiter.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-600" />
                            ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                                    {waiter.name[0]}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-[var(--fg)] text-base sm:text-lg truncate">{waiter.name}</h3>
                                <p className="text-xs sm:text-sm text-[var(--muted)] truncate">{waiter.phone}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${waiter.is_on_duty ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-600 dark:bg-gray-500/30 dark:text-gray-400'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: waiter.is_on_duty ? '#10b981' : '#6b7280' }} />
                                    {waiter.is_on_duty ? 'On Duty' : 'Off Duty'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {waiter.is_on_duty ? (
                                <button
                                    onClick={() => handleClockOut(waiter.id)}
                                    disabled={loading}
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-sm sm:text-base transition-all shadow-md"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Clock Out</span>
                                    <span className="sm:hidden">Out</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleClockIn(waiter.id)}
                                    disabled={loading}
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 active:scale-95 disabled:opacity-50 text-sm sm:text-base transition-all shadow-md"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Clock In</span>
                                    <span className="sm:hidden">In</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {waiters.length === 0 && (
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
                        <Timer className="w-16 h-16 mx-auto mb-4 text-[var(--muted)]" />
                        <p className="text-[var(--fg)] font-medium mb-2">No staff members found</p>
                        <p className="text-sm text-[var(--muted)]">Add staff members in admin panel</p>
                    </div>
                )}
            </div>
        </div>
    )
}
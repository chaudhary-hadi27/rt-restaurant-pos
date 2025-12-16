// src/app/admin/shifts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react'

export default function ShiftManagement() {
    const [waiters, setWaiters] = useState<any[]>([])
    const [shifts, setShifts] = useState<any[]>([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [date])

    const loadData = async () => {
        // Get all waiters
        const { data: waitersData } = await supabase
            .from('waiters')
            .select('*')
            .eq('is_active', true)
            .order('name')

        // Get shifts for selected date
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { data: shiftsData } = await supabase
            .from('waiter_shifts')
            .select('*')
            .gte('clock_in', startOfDay.toISOString())
            .lte('clock_in', endOfDay.toISOString())

        setWaiters(waitersData || [])
        setShifts(shiftsData || [])
    }

    const handleClockIn = async (waiterId: string) => {
        await supabase.from('waiter_shifts').insert({
            waiter_id: waiterId,
            clock_in: new Date().toISOString()
        })

        await supabase
            .from('waiters')
            .update({ is_on_duty: true })
            .eq('id', waiterId)

        loadData()
    }

    const handleClockOut = async (shiftId: string, waiterId: string) => {
        await supabase
            .from('waiter_shifts')
            .update({ clock_out: new Date().toISOString() })
            .eq('id', shiftId)

        await supabase
            .from('waiters')
            .update({ is_on_duty: false })
            .eq('id', waiterId)

        loadData()
    }

    const calculateDuration = (clockIn: string, clockOut: string | null) => {
        const start = new Date(clockIn)
        const end = clockOut ? new Date(clockOut) : new Date()
        const diff = end.getTime() - start.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    const getActiveShift = (waiterId: string) => {
        return shifts.find(s => s.waiter_id === waiterId && !s.clock_out)
    }

    const getTotalHours = (waiterId: string) => {
        const waiterShifts = shifts.filter(s => s.waiter_id === waiterId && s.clock_out)
        return waiterShifts.reduce((total, shift) => {
            const duration = new Date(shift.clock_out).getTime() - new Date(shift.clock_in).getTime()
            return total + duration / (1000 * 60 * 60)
        }, 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                        Shift Management
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        Track waiter shifts and working hours
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="px-4 py-2 rounded-lg border font-medium"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <Clock className="w-6 h-6 mb-3" style={{ color: '#3b82f6' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>On Duty Now</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        {waiters.filter(w => w.is_on_duty).length}
                    </p>
                </div>

                <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <LogIn className="w-6 h-6 mb-3" style={{ color: '#10b981' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Total Shifts</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        {shifts.length}
                    </p>
                </div>

                <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <Clock className="w-6 h-6 mb-3" style={{ color: '#f59e0b' }} />
                    <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Total Hours</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        {shifts.filter(s => s.clock_out).reduce((sum, s) => {
                            const duration = new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime()
                            return sum + duration / (1000 * 60 * 60)
                        }, 0).toFixed(1)}h
                    </p>
                </div>
            </div>

            {/* Waiters List */}
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <table className="w-full">
                    <thead className="border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <tr>
                        <th className="text-left px-6 py-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                            WAITER
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                            STATUS
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                            CURRENT SHIFT
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                            TODAY'S HOURS
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                            ACTION
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {waiters.map(waiter => {
                        const activeShift = getActiveShift(waiter.id)
                        const totalHours = getTotalHours(waiter.id)

                        return (
                            <tr key={waiter.id} className="hover:bg-[var(--bg)] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {waiter.profile_pic ? (
                                            <img src={waiter.profile_pic} alt={waiter.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                                                {waiter.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--fg)' }}>{waiter.name}</p>
                                            <p className="text-sm" style={{ color: 'var(--muted)' }}>{waiter.phone}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        waiter.is_on_duty
                            ? 'bg-green-600/20 text-green-600'
                            : 'bg-gray-600/20 text-gray-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${waiter.is_on_duty ? 'bg-green-600' : 'bg-gray-600'}`} />
                        {waiter.is_on_duty ? 'On Duty' : 'Off Duty'}
                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    {activeShift ? (
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--fg)' }}>
                                                {new Date(activeShift.clock_in).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                                {calculateDuration(activeShift.clock_in, null)}
                                            </p>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--muted)' }}>-</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <p className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
                                        {totalHours.toFixed(1)}h
                                    </p>
                                </td>

                                <td className="px-6 py-4 text-right">
                                    {activeShift ? (
                                        <button
                                            onClick={() => handleClockOut(activeShift.id, waiter.id)}
                                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 ml-auto"
                                            style={{ backgroundColor: '#ef4444', color: '#fff' }}
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Clock Out
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleClockIn(waiter.id)}
                                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 ml-auto"
                                            style={{ backgroundColor: '#10b981', color: '#fff' }}
                                        >
                                            <LogIn className="w-4 h-4" />
                                            Clock In
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
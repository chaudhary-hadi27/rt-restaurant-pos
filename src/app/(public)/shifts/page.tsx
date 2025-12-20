'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react'
import AutoSidebar, { useSidebarItems } from '@/components/layout/AutoSidebar'
import ResponsiveStatsGrid from '@/components/ui/ResponsiveStatsGrid'
import { UniversalDataTable } from '@/components/ui/UniversalDataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'

export default function ShiftManagement() {
    const [waiters, setWaiters] = useState<any[]>([])
    const [shifts, setShifts] = useState<any[]>([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [dutyFilter, setDutyFilter] = useState<'all' | 'on-duty' | 'off-duty'>('all')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const toast = useToast()

    useEffect(() => { loadData() }, [date])

    const loadData = async () => {
        setLoading(true)
        const { data: waitersData } = await supabase.from('waiters').select('*').eq('is_active', true).order('name')

        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { data: shiftsData } = await supabase.from('waiter_shifts').select('*').gte('clock_in', startOfDay.toISOString()).lte('clock_in', endOfDay.toISOString())

        setWaiters(waitersData || [])
        setShifts(shiftsData || [])
        setLoading(false)
    }

    const handleClockIn = async (waiterId: string) => {
        await supabase.from('waiter_shifts').insert({ waiter_id: waiterId, clock_in: new Date().toISOString() })
        await supabase.from('waiters').update({ is_on_duty: true }).eq('id', waiterId)
        toast.add('success', '✅ Clocked in!')
        loadData()
    }

    const handleClockOut = async (shiftId: string, waiterId: string) => {
        await supabase.from('waiter_shifts').update({ clock_out: new Date().toISOString() }).eq('id', shiftId)
        await supabase.from('waiters').update({ is_on_duty: false }).eq('id', waiterId)
        toast.add('success', '✅ Clocked out!')
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

    const getActiveShift = (waiterId: string) => shifts.find(s => s.waiter_id === waiterId && !s.clock_out)
    const getTotalHours = (waiterId: string) => {
        const waiterShifts = shifts.filter(s => s.waiter_id === waiterId && s.clock_out)
        return waiterShifts.reduce((total, shift) => {
            const duration = new Date(shift.clock_out).getTime() - new Date(shift.clock_in).getTime()
            return total + duration / (1000 * 60 * 60)
        }, 0)
    }

    const filteredWaiters = waiters.filter(w => {
        if (dutyFilter === 'all') return true
        if (dutyFilter === 'on-duty') return w.is_on_duty
        if (dutyFilter === 'off-duty') return !w.is_on_duty
        return true
    })

    const stats = [
        {
            label: 'On Duty',
            value: waiters.filter(w => w.is_on_duty).length,
            icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />,
            color: '#3b82f6',
            onClick: () => setDutyFilter('on-duty'),
            active: dutyFilter === 'on-duty'
        },
        {
            label: 'Total Shifts',
            value: shifts.length,
            icon: <LogIn className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#10b981' }} />,
            color: '#10b981',
            onClick: () => setDutyFilter('all'),
            active: dutyFilter === 'all'
        },
        {
            label: 'Total Hours',
            value: `${shifts.filter(s => s.clock_out).reduce((sum, s) => {
                const duration = new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime()
                return sum + duration / (1000 * 60 * 60)
            }, 0).toFixed(1)}h`,
            icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f59e0b' }} />,
            color: '#f59e0b'
        }
    ]

    const sidebarItems = useSidebarItems([
        { id: 'all', label: 'All Staff', icon: '👥', count: waiters.length },
        { id: 'on-duty', label: 'On Duty', icon: '🟢', count: waiters.filter(w => w.is_on_duty).length },
        { id: 'off-duty', label: 'Off Duty', icon: '⭕', count: waiters.filter(w => !w.is_on_duty).length }
    ], dutyFilter, (id: string) => setDutyFilter(id as any))

    const columns = [
        {
            key: 'waiter',
            label: 'Staff',
            render: (row: any) => (
                <div className="flex items-center gap-2 sm:gap-3">
                    {row.profile_pic ? (
                        <img src={row.profile_pic} alt={row.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {row.name[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-[var(--fg)] text-sm">{row.name}</p>
                        <p className="text-xs text-[var(--muted)]">{row.phone}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: any) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${row.is_on_duty ? 'bg-green-600/20 text-green-600' : 'bg-gray-600/20 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.is_on_duty ? 'bg-green-600' : 'bg-gray-600'}`} />
                    {row.is_on_duty ? 'On' : 'Off'}
                </span>
            )
        },
        {
            key: 'shift',
            label: 'Shift',
            mobileHidden: true,
            render: (row: any) => {
                const activeShift = getActiveShift(row.id)
                if (!activeShift) return <span className="text-sm text-[var(--muted)]">-</span>
                return (
                    <div>
                        <p className="font-medium text-[var(--fg)] text-sm">{new Date(activeShift.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-[var(--muted)]">{calculateDuration(activeShift.clock_in, null)}</p>
                    </div>
                )
            }
        },
        {
            key: 'hours',
            label: 'Hours',
            align: 'right' as const,
            render: (row: any) => <p className="font-bold text-base sm:text-lg text-[var(--fg)]">{getTotalHours(row.id).toFixed(1)}h</p>
        },
        {
            key: 'action',
            label: 'Action',
            align: 'right' as const,
            render: (row: any) => {
                const activeShift = getActiveShift(row.id)
                return (
                    <div className="flex justify-end">
                        {activeShift ? (
                            <button onClick={() => handleClockOut(activeShift.id, row.id)} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:bg-red-700 active:scale-95">
                                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Clock Out</span>
                                <span className="sm:hidden">Out</span>
                            </button>
                        ) : (
                            <button onClick={() => handleClockIn(row.id)} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:bg-green-700 active:scale-95">
                                <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Clock In</span>
                                <span className="sm:hidden">In</span>
                            </button>
                        )}
                    </div>
                )
            }
        }
    ]

    const renderMobileCard = (row: any) => {
        const activeShift = getActiveShift(row.id)
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {row.profile_pic ? (
                            <img src={row.profile_pic} alt={row.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {row.name[0]}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-[var(--fg)] text-sm">{row.name}</p>
                            <p className="text-xs text-[var(--muted)]">{row.phone}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_on_duty ? 'bg-green-600/20 text-green-600' : 'bg-gray-600/20 text-gray-600'}`}>
                        {row.is_on_duty ? '🟢 On' : '⭕ Off'}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        {activeShift ? (
                            <>
                                <p className="text-xs text-[var(--muted)]">Shift: {new Date(activeShift.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-xs text-[var(--muted)]">{calculateDuration(activeShift.clock_in, null)}</p>
                            </>
                        ) : (
                            <p className="text-xs text-[var(--muted)]">No active shift</p>
                        )}
                        <p className="font-bold text-base">Hours: {getTotalHours(row.id).toFixed(1)}h</p>
                    </div>
                    {activeShift ? (
                        <button onClick={() => handleClockOut(activeShift.id, row.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm active:scale-95">
                            <LogOut className="w-4 h-4" /> Out
                        </button>
                    ) : (
                        <button onClick={() => handleClockIn(row.id)} className="px-3 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm active:scale-95">
                            <LogIn className="w-4 h-4" /> In
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
            <AutoSidebar items={sidebarItems} title="Filters" />

            <div className="min-h-screen bg-[var(--bg)] lg:ml-64">
                <PageHeader
                    title="Shift Management"
                    subtitle="Track staff shifts & hours"
                    action={
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border font-medium bg-[var(--card)] border-[var(--border)] text-[var(--fg)] text-xs sm:text-sm"
                            />
                        </div>
                    }
                />

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    <ResponsiveStatsGrid stats={stats} />
                    <UniversalDataTable
                        columns={columns}
                        data={filteredWaiters}
                        loading={loading}
                        searchable
                        searchPlaceholder="Search staff..."
                        renderMobileCard={renderMobileCard}
                    />
                </div>
            </div>
        </>
    )
}
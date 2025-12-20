'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp } from 'lucide-react'

export default function RevenueChart() {
    const [data, setData] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: summaries } = await supabase
                .from('daily_summaries')
                .select('*')
                .order('date', { ascending: false })
                .limit(7)

            setData((summaries || []).reverse())
        }
        load()
    }, [])

    const max = Math.max(...data.map(d => d.total_revenue), 1)

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-[var(--fg)]">Revenue Trend (7 Days)</h3>
            </div>

            <div className="flex items-end gap-2 h-48">
                {data.map((day, idx) => {
                    const height = (day.total_revenue / max) * 100
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                            <div
                                className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                                style={{ height: `${height}%`, backgroundColor: '#3b82f6', minHeight: '8px' }}
                                title={`PKR ${day.total_revenue.toLocaleString()}`}
                            />
                            <span className="text-xs mt-2 text-[var(--muted)]">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-[var(--muted)]">Total Revenue</p>
                    <p className="text-lg font-bold text-[var(--fg)]">
                        PKR {data.reduce((s, d) => s + d.total_revenue, 0).toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-[var(--muted)]">Net Profit</p>
                    <p className="text-lg font-bold text-green-600">
                        PKR {data.reduce((s, d) => s + d.net_profit, 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    )
}
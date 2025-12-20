'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award } from 'lucide-react'

export default function TopPerformers() {
    const [performers, setPerformers] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('waiters')
                .select('id, name, profile_pic, total_revenue, total_orders')
                .eq('is_active', true)
                .order('total_revenue', { ascending: false })
                .limit(5)

            setPerformers(data || [])
        }
        load()
    }, [])

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <Award className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-bold text-[var(--fg)]">Top Performers</h3>
            </div>

            <div className="space-y-3">
                {performers.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-4 p-3 bg-[var(--bg)] rounded-lg">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                idx === 0 ? 'bg-yellow-600' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-blue-600'
            }`}>
              {idx + 1}
            </span>
                        {p.profile_pic ? (
                            <img src={p.profile_pic} className="w-10 h-10 rounded-full" alt={p.name} />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {p.name[0]}
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-medium text-[var(--fg)]">{p.name}</p>
                            <p className="text-xs text-[var(--muted)]">{p.total_orders} orders</p>
                        </div>
                        <p className="font-bold text-blue-600">PKR {p.total_revenue.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
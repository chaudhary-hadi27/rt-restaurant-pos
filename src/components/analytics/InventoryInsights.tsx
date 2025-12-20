'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, TrendingDown } from 'lucide-react'

export default function InventoryInsights() {
    const [data, setData] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data: usage } = await supabase
                .from('inventory_usage')
                .select('inventory_item_id, quantity_used, cost, inventory_items(name)')
                .gte('created_at', today)

            const grouped = (usage || []).reduce((acc: any, item) => {
                const id = item.inventory_item_id
                if (!acc[id]) {
                    acc[id] = { name: item.inventory_items.name, quantity: 0, cost: 0 }
                }
                acc[id].quantity += item.quantity_used
                acc[id].cost += item.cost
                return acc
            }, {})

            setData(Object.values(grouped).sort((a: any, b: any) => b.cost - a.cost).slice(0, 10))
        }
        load()
    }, [])

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-[var(--fg)]">Top Inventory Usage (Today)</h3>
            </div>

            <div className="space-y-3">
                {data.map((item: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                        <div className="flex-1">
                            <p className="font-medium text-[var(--fg)]">{item.name}</p>
                            <p className="text-xs text-[var(--muted)]">{item.quantity} units used</p>
                        </div>
                        <p className="font-bold text-red-600">PKR {item.cost.toLocaleString()}</p>
                    </div>
                ))}
                {data.length === 0 && (
                    <p className="text-center py-8 text-[var(--muted)]">No usage recorded today</p>
                )}
            </div>
        </div>
    )
}
'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { DataGrid } from '@/components/ui/DataGrid'
import { SearchFilter } from '@/components/ui/SearchFilter'
import { StatCard } from '@/components/ui/StatCard'
import { Package, Plus } from 'lucide-react'

export default function InventoryPage() {
    const { data: items, loading, insert, update, remove } = useSupabase('inventory_items', {
        select: '*, inventory_categories(name, icon)',
        filter: { is_active: true },
        realtime: true
    })

    const { data: categories } = useSupabase('inventory_categories')
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<any>(null)

    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.purchase_price), 0)

    const columns = [
        { key: 'name', label: 'Item' },
        { key: 'quantity', label: 'Quantity', render: (item: any) => `${item.quantity} ${item.unit}`, className: 'text-right' },
        { key: 'purchase_price', label: 'Price', render: (item: any) => `PKR ${item.purchase_price}`, className: 'text-right' },
        { key: 'total', label: 'Value', render: (item: any) => `PKR ${(item.quantity * item.purchase_price).toFixed(2)}`, className: 'text-right font-bold' }
    ]

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--fg)]">Inventory</h1>
                    <p className="text-sm text-[var(--muted)]">{items.length} items • PKR {totalValue.toLocaleString()}</p>
                </div>
                <button onClick={() => setModal({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search inventory..." />

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <DataGrid
                    data={filtered}
                    columns={columns}
                    loading={loading}
                    onRowClick={(item) => setModal(item)}
                    emptyMessage="No inventory items found"
                />
            </div>
        </div>
    )
}
// src/components/features/table-transfer/TableTransferModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, ArrowRight, CheckCircle } from 'lucide-react'

type TableTransferProps = {
    currentTable: {
        id: string
        table_number: number
        current_order_id: string
    }
    onClose: () => void
    onSuccess: () => void
}

export default function TableTransferModal({ currentTable, onClose, onSuccess }: TableTransferProps) {
    const [tables, setTables] = useState<any[]>([])
    const [selectedTable, setSelectedTable] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        loadTables()
    }, [])

    const loadTables = async () => {
        const { data } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('status', 'available')
            .neq('id', currentTable.id)
            .order('table_number')

        setTables(data || [])
    }

    const handleTransfer = async () => {
        if (!selectedTable) return

        setLoading(true)
        try {
            // Update order's table_id
            await supabase
                .from('orders')
                .update({ table_id: selectedTable })
                .eq('id', currentTable.current_order_id)

            // Update old table to available
            await supabase
                .from('restaurant_tables')
                .update({
                    status: 'available',
                    current_order_id: null,
                    waiter_id: null
                })
                .eq('id', currentTable.id)

            // Update new table to occupied
            await supabase
                .from('restaurant_tables')
                .update({
                    status: 'occupied',
                    current_order_id: currentTable.current_order_id
                })
                .eq('id', selectedTable)

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Transfer failed:', error)
            alert('Failed to transfer table')
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>Transfer Table</h3>
                    <button onClick={onClose} className="p-2 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Current Table */}
                    <div className="flex items-center justify-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#ef4444' }}>
                                <span className="text-3xl font-bold text-white">{currentTable.table_number}</span>
                            </div>
                            <p className="font-medium" style={{ color: 'var(--fg)' }}>Current Table</p>
                        </div>

                        <ArrowRight className="w-8 h-8" style={{ color: 'var(--muted)' }} />

                        <div className="text-center">
                            <div className="w-24 h-24 rounded-xl flex items-center justify-center mb-3" style={{
                                backgroundColor: selectedTable ? '#10b981' : 'var(--bg)',
                                border: selectedTable ? 'none' : '2px dashed var(--border)'
                            }}>
                <span className="text-3xl font-bold" style={{ color: selectedTable ? '#fff' : 'var(--muted)' }}>
                  {selectedTable ? tables.find(t => t.id === selectedTable)?.table_number : '?'}
                </span>
                            </div>
                            <p className="font-medium" style={{ color: 'var(--fg)' }}>New Table</p>
                        </div>
                    </div>

                    {/* Available Tables */}
                    <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>
                            Select Available Table
                        </label>
                        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => setSelectedTable(table.id)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        selectedTable === table.id ? 'border-blue-600 scale-105' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: 'var(--bg)' }}
                                >
                                    <div className="text-3xl font-bold mb-2" style={{ color: 'var(--fg)' }}>
                                        {table.table_number}
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {table.capacity} seats
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                        {table.section}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {tables.length === 0 && (
                            <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                                <p style={{ color: 'var(--muted)' }}>No available tables</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={!selectedTable || loading}
                        className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: '#10b981', color: '#fff' }}
                    >
                        {loading ? (
                            'Transferring...'
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Confirm Transfer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

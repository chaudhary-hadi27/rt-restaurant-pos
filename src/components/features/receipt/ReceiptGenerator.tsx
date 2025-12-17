// src/components/features/receipt/ReceiptGenerator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Printer, Download, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ReceiptProps = {
    order: {
        id: string
        created_at: string
        subtotal: number
        tax: number
        total_amount: number
        restaurant_tables?: { table_number: number }
        waiters?: { name: string }
        order_items: Array<{
            id: string
            quantity: number
            menu_items: {
                name: string
                category_id: string
            }
            total_price: number
        }>
    }
    onClose: () => void
}

export default function ReceiptModal({ order, onClose }: ReceiptProps) {
    const [categories, setCategories] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        const { data } = await supabase
            .from('menu_categories')
            .select('id, name, icon')
            .order('display_order')

        setCategories(data || [])
    }

    // Group items by category
    const groupedItems = order.order_items.reduce((acc: any, item) => {
        const categoryId = item.menu_items.category_id
        if (!acc[categoryId]) {
            acc[categoryId] = []
        }
        acc[categoryId].push(item)
        return acc
    }, {})

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        const receiptHTML = document.getElementById('receipt-content')?.innerHTML || ''
        const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.id.slice(0, 8)}</title>
          <style>
            body { 
              font-family: monospace; 
              max-width: 400px; 
              margin: 20px auto; 
              padding: 20px;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 2px dashed #000; margin: 10px 0; }
            .category-header { 
              font-weight: bold; 
              margin-top: 15px; 
              margin-bottom: 8px;
              padding: 5px 8px;
              background: #f0f0f0;
              border-left: 3px solid #000;
            }
            table { width: 100%; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .total-row { font-size: 18px; margin-top: 10px; }
          </style>
        </head>
        <body>${receiptHTML}</body>
      </html>
    `

        const blob = new Blob([fullHTML], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${order.id.slice(0, 8)}.html`
        a.click()
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <Printer className="w-6 h-6" style={{ color: '#3b82f6' }} />
                        <h3 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>Receipt</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Receipt Content */}
                <div id="receipt-content" className="p-6 font-mono" style={{ backgroundColor: 'var(--bg)' }}>
                    {/* Restaurant Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--fg)' }}>
                            RT Restaurant
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            Delicious Food, Memorable Moments
                        </p>
                        <div className="border-t-2 border-dashed my-3" style={{ borderColor: 'var(--border)' }}></div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            Sooter Mills Rd, Lahore
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            Tel: +92 321 9343489
                        </p>
                    </div>

                    <div className="border-t-2 border-dashed my-4" style={{ borderColor: 'var(--border)' }}></div>

                    {/* Order Info */}
                    <div className="space-y-1 mb-4 text-sm">
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--muted)' }}>Order #</span>
                            <span style={{ color: 'var(--fg)' }} className="font-bold">
                                {order.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--muted)' }}>Date</span>
                            <span style={{ color: 'var(--fg)' }}>
                                {new Date(order.created_at).toLocaleString()}
                            </span>
                        </div>
                        {order.restaurant_tables && (
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--muted)' }}>Table</span>
                                <span style={{ color: 'var(--fg)' }}>
                                    #{order.restaurant_tables.table_number}
                                </span>
                            </div>
                        )}
                        {order.waiters && (
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--muted)' }}>Waiter</span>
                                <span style={{ color: 'var(--fg)' }}>{order.waiters.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t-2 border-dashed my-4" style={{ borderColor: 'var(--border)' }}></div>

                    {/* Items Grouped by Category */}
                    <div className="mb-4">
                        {categories
                            .filter(cat => groupedItems[cat.id]?.length > 0)
                            .map(category => (
                                <div key={category.id} className="mb-3">
                                    {/* Category Header */}
                                    <div
                                        className="font-bold text-sm mb-2 px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: 'var(--card)',
                                            color: 'var(--fg)',
                                            borderLeft: '3px solid #3b82f6'
                                        }}
                                    >
                                        {category.icon} {category.name.toUpperCase()}
                                    </div>

                                    {/* Items in this category */}
                                    <div className="space-y-2">
                                        {groupedItems[category.id].map((item: any) => (
                                            <div key={item.id} className="text-sm">
                                                <div className="flex justify-between">
                                                    <span style={{ color: 'var(--fg)' }}>
                                                        {item.quantity}x {item.menu_items.name}
                                                    </span>
                                                    <span style={{ color: 'var(--fg)' }} className="font-bold">
                                                        PKR {item.total_price}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                        {/* Uncategorized items (if any) */}
                        {Object.keys(groupedItems).filter(catId =>
                            !categories.find(c => c.id === catId)
                        ).length > 0 && (
                            <div className="mb-3">
                                <div
                                    className="font-bold text-sm mb-2 px-2 py-1 rounded"
                                    style={{
                                        backgroundColor: 'var(--card)',
                                        color: 'var(--fg)',
                                        borderLeft: '3px solid #3b82f6'
                                    }}
                                >
                                    📦 OTHER ITEMS
                                </div>
                                <div className="space-y-2">
                                    {Object.keys(groupedItems)
                                        .filter(catId => !categories.find(c => c.id === catId))
                                        .map(catId =>
                                            groupedItems[catId].map((item: any) => (
                                                <div key={item.id} className="text-sm">
                                                    <div className="flex justify-between">
                                                        <span style={{ color: 'var(--fg)' }}>
                                                            {item.quantity}x {item.menu_items.name}
                                                        </span>
                                                        <span style={{ color: 'var(--fg)' }} className="font-bold">
                                                            PKR {item.total_price}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t-2 border-dashed my-4" style={{ borderColor: 'var(--border)' }}></div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                            <span style={{ color: 'var(--fg)' }}>PKR {order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--muted)' }}>Tax (5%)</span>
                            <span style={{ color: 'var(--fg)' }}>PKR {order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                            <span style={{ color: 'var(--fg)' }}>TOTAL</span>
                            <span style={{ color: '#3b82f6' }}>PKR {order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed my-4" style={{ borderColor: 'var(--border)' }}></div>

                    {/* Footer */}
                    <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                        <p className="mb-1 font-bold">Thank you for dining with us!</p>
                        <p className="mb-2">Please visit again</p>
                        <p className="text-xs">Follow us: @rtrestaurant</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={handleDownload}
                        className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                    >
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content,
                    #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    )
}
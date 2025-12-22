'use client'

import { useState, useEffect, useRef } from 'react'
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
    const [downloading, setDownloading] = useState(false)
    const receiptRef = useRef<HTMLDivElement>(null)
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

    const handleDownload = async () => {
        setDownloading(true)
        try {
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default

            if (!receiptRef.current) return

            // Capture the receipt as canvas
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true
            })

            // Convert to blob
            canvas.toBlob((blob) => {
                if (!blob) return

                // Create download link
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `receipt-${order.id.slice(0, 8)}.png`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }, 'image/png')

        } catch (error) {
            console.error('Download failed:', error)
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/70">
            <div className="rounded-xl w-full max-w-md border bg-white">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <Printer className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">Receipt</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:opacity-70 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Receipt Content */}
                <div
                    ref={receiptRef}
                    className="p-6 font-mono bg-white"
                    style={{ maxHeight: '60vh', overflowY: 'auto' }}
                >
                    {/* Restaurant Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-1 text-gray-900">
                            RT Restaurant
                        </h2>
                        <p className="text-sm text-gray-600">
                            Delicious Food, Memorable Moments
                        </p>
                        <div className="border-t-2 border-dashed my-3 border-gray-300"></div>
                        <p className="text-sm text-gray-600">
                            Sooter Mills Rd, Lahore
                        </p>
                        <p className="text-sm text-gray-600">
                            Tel: +92 321 9343489
                        </p>
                    </div>

                    <div className="border-t-2 border-dashed my-4 border-gray-300"></div>

                    {/* Order Info */}
                    <div className="space-y-1 mb-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Order #</span>
                            <span className="font-bold text-gray-900">
                                {order.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date</span>
                            <span className="text-gray-900">
                                {new Date(order.created_at).toLocaleString()}
                            </span>
                        </div>
                        {order.restaurant_tables && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Table</span>
                                <span className="text-gray-900">
                                    #{order.restaurant_tables.table_number}
                                </span>
                            </div>
                        )}
                        {order.waiters && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Waiter</span>
                                <span className="text-gray-900">{order.waiters.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t-2 border-dashed my-4 border-gray-300"></div>

                    {/* Items Grouped by Category */}
                    <div className="mb-4">
                        {categories
                            .filter(cat => groupedItems[cat.id]?.length > 0)
                            .map(category => (
                                <div key={category.id} className="mb-3">
                                    <div
                                        className="font-bold text-sm mb-2 px-2 py-1 rounded bg-gray-100 text-gray-900"
                                        style={{ borderLeft: '3px solid #3b82f6' }}
                                    >
                                        {category.icon} {category.name.toUpperCase()}
                                    </div>

                                    <div className="space-y-2">
                                        {groupedItems[category.id].map((item: any) => (
                                            <div key={item.id} className="text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">
                                                        {item.quantity}x {item.menu_items.name}
                                                    </span>
                                                    <span className="font-bold text-gray-900">
                                                        PKR {item.total_price}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                        {/* Uncategorized items */}
                        {Object.keys(groupedItems).filter(catId =>
                            !categories.find(c => c.id === catId)
                        ).length > 0 && (
                            <div className="mb-3">
                                <div
                                    className="font-bold text-sm mb-2 px-2 py-1 rounded bg-gray-100 text-gray-900"
                                    style={{ borderLeft: '3px solid #3b82f6' }}
                                >
                                    📦 OTHER ITEMS
                                </div>
                                <div className="space-y-2">
                                    {Object.keys(groupedItems)
                                        .filter(catId => !categories.find(c => c.id === catId))
                                        .map((catId, catIndex) =>
                                            groupedItems[catId].map((item: any, itemIndex: number) => (
                                                <div key={`uncategorized-${catId}-${item.id}-${catIndex}-${itemIndex}`} className="text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-900">
                                                            {item.quantity}x {item.menu_items.name}
                                                        </span>
                                                        <span className="font-bold text-gray-900">
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

                    <div className="border-t-2 border-dashed my-4 border-gray-300"></div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">PKR {order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax (5%)</span>
                            <span className="text-gray-900">PKR {order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                            <span className="text-gray-900">TOTAL</span>
                            <span className="text-blue-600">PKR {order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed my-4 border-gray-300"></div>

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-600">
                        <p className="mb-1 font-bold">Thank you for dining with us!</p>
                        <p className="mb-2">Please visit again</p>
                        <p className="text-xs">Follow us: @rtrestaurant</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t">
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50"
                    >
                        {downloading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download PNG
                            </>
                        )}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <Printer className="w-4 h-4" />
                        Print
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
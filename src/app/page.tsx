"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingCart, Plus, Minus, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function MenuPage() {
    const [categories, setCategories] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [cart, setCart] = useState<any[]>([])
    const [selected, setSelected] = useState('all')
    const [cartOpen, setCartOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        const [cats, menu] = await Promise.all([
            supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
            supabase.from('menu_items').select('*, menu_categories(name, icon)').eq('is_available', true)
        ])
        setCategories(cats.data || [])
        setItems(menu.data || [])
    }

    const addToCart = (item: any) => {
        const existing = cart.find(c => c.id === item.id)
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
        } else {
            setCart([...cart, { ...item, quantity: 1 }])
        }
    }

    const updateQty = (id: string, delta: number) => {
        setCart(cart.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0))
    }

    const filtered = selected === 'all' ? items : items.filter(i => i.category_id === selected)
    const subtotal = cart.reduce((s, c) => s + (c.price * c.quantity), 0)
    const tax = subtotal * 0.05
    const total = subtotal + tax

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--card)] border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--fg)]">Restaurant Menu</h1>
                        <p className="text-sm text-[var(--muted)]">Browse our selection</p>
                    </div>
                    <button onClick={() => setCartOpen(true)} className="relative px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium">
                        <ShoppingCart className="w-5 h-5" />
                        Cart
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Categories */}
            <div className="sticky top-[73px] z-30 bg-[var(--card)] border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
                    <button onClick={() => setSelected('all')} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selected === 'all' ? 'bg-blue-600 text-white' : 'bg-[var(--bg)] text-[var(--fg)]'}`}>
                        All Items
                    </button>
                    {categories.map(c => (
                        <button key={c.id} onClick={() => setSelected(c.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selected === c.id ? 'bg-blue-600 text-white' : 'bg-[var(--bg)] text-[var(--fg)]'}`}>
                            {c.icon} {c.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(i => (
                        <div key={i.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                            {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-48 object-cover" />}
                            <div className="p-4">
                                <h3 className="font-semibold text-lg text-[var(--fg)] mb-1">{i.name}</h3>
                                {i.description && <p className="text-sm text-[var(--muted)] mb-3">{i.description}</p>}
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-blue-600">PKR {i.price}</span>
                                    <button onClick={() => addToCart(i)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Drawer */}
            {cartOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setCartOpen(false)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] z-50 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                            <h2 className="text-xl font-bold text-[var(--fg)]">Your Cart</h2>
                            <button onClick={() => setCartOpen(false)} className="p-2 text-[var(--muted)]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-20">
                                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-[var(--muted)] opacity-20" />
                                    <p className="text-[var(--muted)]">Your cart is empty</p>
                                </div>
                            ) : (
                                cart.map(c => (
                                    <div key={c.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium text-[var(--fg)]">{c.name}</h4>
                                                <p className="text-sm text-[var(--muted)]">PKR {c.price} each</p>
                                            </div>
                                            <span className="font-bold text-blue-600">PKR {c.price * c.quantity}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQty(c.id, -1)} className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                                                <Minus className="w-4 h-4 text-[var(--fg)]" />
                                            </button>
                                            <span className="font-semibold px-3 text-[var(--fg)]">{c.quantity}</span>
                                            <button onClick={() => updateQty(c.id, 1)} className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                                                <Plus className="w-4 h-4 text-[var(--fg)]" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="border-t border-[var(--border)] p-4 space-y-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--muted)]">Subtotal</span>
                                        <span className="text-[var(--fg)]">PKR {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--muted)]">Tax (5%)</span>
                                        <span className="text-[var(--fg)]">PKR {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                                        <span className="text-[var(--fg)]">Total</span>
                                        <span className="text-blue-600">PKR {total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Button onClick={() => alert('Order placed!')} className="w-full">Place Order</Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
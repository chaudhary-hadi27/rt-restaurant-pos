// src/app/menu/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MenuItem, MenuCategory, CartItem } from '@/types/menu';
import { ShoppingCart, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { calculateCart } from '@/lib/utils/cart';

export default function MenuPage() {
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'confirm'>('cart');
    const [orderDetails, setOrderDetails] = useState({ table: '', waiter: '' });
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        setLoading(true);
        const [cats, menuItems] = await Promise.all([
            supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
            supabase.from('menu_items').select('*, menu_categories(name, icon)').eq('is_available', true)
        ]);
        setCategories(cats.data || []);
        setItems(menuItems.data || []);
        setLoading(false);
    };

    const addToCart = (item: MenuItem) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { id: item.id, item, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
    };

    const placeOrder = async () => {
        if (!orderDetails.table || !orderDetails.waiter || cart.length === 0) return;

        const { subtotal, tax, total } = calculateCart(cart);

        const { data: order, error } = await supabase.from('orders').insert({
            table_id: orderDetails.table,
            waiter_id: orderDetails.waiter,
            subtotal,
            tax,
            total_amount: total,
            status: 'pending',
            order_type: 'dine-in'
        }).select().single();

        if (order && !error) {
            const orderItems = cart.map(c => ({
                order_id: order.id,
                menu_item_id: c.item.id,
                quantity: c.quantity,
                unit_price: c.item.price,
                total_price: c.item.price * c.quantity,
                notes: c.notes
            }));

            await supabase.from('order_items').insert(orderItems);

            setCart([]);
            setCartOpen(false);
            setCheckoutStep('cart');
            setOrderDetails({ table: '', waiter: '' });
            alert('Order placed successfully! 🎉');
        }
    };

    const filtered = selectedCategory === 'all' ? items : items.filter(i => i.category_id === selectedCategory);
    const { subtotal, tax, total, itemCount } = calculateCart(cart);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
            {/* Header */}
            <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Restaurant Menu</h1>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Browse our delicious selection</p>
                    </div>
                    <button onClick={() => setCartOpen(true)} className="relative px-4 py-2 rounded-lg flex items-center gap-2 font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                        <ShoppingCart className="w-5 h-5" />
                        Cart
                        {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                {itemCount}
              </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Categories */}
            <div className="sticky top-[73px] z-30 border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
                    <button onClick={() => setSelectedCategory('all')} className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap" style={{ backgroundColor: selectedCategory === 'all' ? 'var(--accent)' : 'var(--hover-bg)', color: selectedCategory === 'all' ? '#fff' : 'var(--fg)' }}>
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2" style={{ backgroundColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--hover-bg)', color: selectedCategory === cat.id ? '#fff' : 'var(--fg)' }}>
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
                        <p className="mt-4" style={{ color: 'var(--muted)' }}>Loading menu...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(item => (
                            <div key={item.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                                {item.image_url && (
                                    <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                                )}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--fg)' }}>{item.name}</h3>
                                    {item.description && (
                                        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{item.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>PKR {item.price}</span>
                                        <button onClick={() => addToCart(item)} className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Drawer */}
            {cartOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setCartOpen(false)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-md border-l z-50 flex flex-col" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>Your Cart</h2>
                            <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {checkoutStep === 'cart' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-20">
                                            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--fg)' }} />
                                            <p style={{ color: 'var(--muted)' }}>Your cart is empty</p>
                                        </div>
                                    ) : (
                                        cart.map(c => (
                                            <div key={c.id} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium" style={{ color: 'var(--fg)' }}>{c.item.name}</h4>
                                                        <p className="text-sm" style={{ color: 'var(--muted)' }}>PKR {c.item.price} each</p>
                                                    </div>
                                                    <span className="font-bold" style={{ color: 'var(--accent)' }}>PKR {c.item.price * c.quantity}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                                                        <button onClick={() => updateQuantity(c.id, -1)} className="p-2" style={{ color: 'var(--fg)' }}>
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="font-semibold px-3" style={{ color: 'var(--fg)' }}>{c.quantity}</span>
                                                        <button onClick={() => updateQuantity(c.id, 1)} className="p-2" style={{ color: 'var(--fg)' }}>
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <input type="text" placeholder="Special notes..." value={c.notes || ''} onChange={(e) => setCart(cart.map(item => item.id === c.id ? { ...item, notes: e.target.value } : item))} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {cart.length > 0 && (
                                    <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                                                <span style={{ color: 'var(--fg)' }}>PKR {subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span style={{ color: 'var(--muted)' }}>Tax (5%)</span>
                                                <span style={{ color: 'var(--fg)' }}>PKR {tax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                                                <span style={{ color: 'var(--fg)' }}>Total</span>
                                                <span style={{ color: 'var(--accent)' }}>PKR {total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setCheckoutStep('details')} className="w-full py-3 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                                            Proceed to Checkout
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {checkoutStep === 'details' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Table Number *</label>
                                        <input type="text" value={orderDetails.table} onChange={(e) => setOrderDetails({ ...orderDetails, table: e.target.value })} placeholder="e.g., 5" className="w-full px-4 py-3 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Waiter Name *</label>
                                        <input type="text" value={orderDetails.waiter} onChange={(e) => setOrderDetails({ ...orderDetails, waiter: e.target.value })} placeholder="e.g., Ahmad" className="w-full px-4 py-3 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
                                    </div>
                                </div>
                                <div className="border-t p-4 flex gap-3" style={{ borderColor: 'var(--border)' }}>
                                    <button onClick={() => setCheckoutStep('cart')} className="flex-1 py-3 rounded-lg font-medium" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}>
                                        Back
                                    </button>
                                    <button onClick={() => setCheckoutStep('confirm')} disabled={!orderDetails.table || !orderDetails.waiter} className="flex-1 py-3 rounded-lg font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                                        Review Order
                                    </button>
                                </div>
                            </>
                        )}

                        {checkoutStep === 'confirm' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                        <h3 className="font-semibold mb-2" style={{ color: 'var(--fg)' }}>Order Details</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span style={{ color: 'var(--muted)' }}>Table:</span>
                                                <span style={{ color: 'var(--fg)' }}>{orderDetails.table}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: 'var(--muted)' }}>Waiter:</span>
                                                <span style={{ color: 'var(--fg)' }}>{orderDetails.waiter}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {cart.map(c => (
                                            <div key={c.id} className="flex justify-between text-sm">
                                                <span style={{ color: 'var(--muted)' }}>{c.quantity}x {c.item.name}</span>
                                                <span style={{ color: 'var(--fg)' }}>PKR {(c.item.price * c.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                                        <div className="flex justify-between font-bold">
                                            <span style={{ color: 'var(--fg)' }}>Total Amount</span>
                                            <span style={{ color: 'var(--accent)' }}>PKR {total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t p-4 flex gap-3" style={{ borderColor: 'var(--border)' }}>
                                    <button onClick={() => setCheckoutStep('details')} className="flex-1 py-3 rounded-lg font-medium" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}>
                                        Back
                                    </button>
                                    <button onClick={placeOrder} className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                                        <CheckCircle className="w-5 h-5" /> Place Order
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
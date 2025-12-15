"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem } from '@/types';
import { Plus, Search, TrendingDown, Package, DollarSign } from 'lucide-react';
import PasswordGate from '@/components/inventory/password-gate';
import AddItemDialog from '@/components/inventory/add-item-dialog';
import InventoryList from '@/components/inventory/inventory-list';

export default function InventoryPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [search, setSearch] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (isAuthenticated) loadItems();
    }, [isAuthenticated]);

    const loadItems = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('inventory_items')
            .select('*')
            .order('created_at', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = items.filter(item => item.quantity <= item.reorder_level).length;

    if (!isAuthenticated) {
        return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--fg)' }}>
                        Inventory Management
                    </h1>
                    <p className="text-sm md:text-base mt-1" style={{ color: 'var(--muted)' }}>
                        Manage your restaurant inventory
                    </p>
                </div>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                >
                    <Plus className="text-black w-4 h-4" />
                    <span>Add Item</span>
                </button>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="p-4 md:p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}>
                            <Package className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm" style={{ color: 'var(--muted)' }}>Total Items</p>
                            <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--fg)' }}>{items.length}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#22c55e', opacity: 0.1 }}>
                            <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm" style={{ color: 'var(--muted)' }}>Total Value</p>
                            <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--fg)' }}>${totalValue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 rounded-xl border sm:col-span-2 lg:col-span-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b', opacity: 0.1 }}>
                            <TrendingDown className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm" style={{ color: 'var(--muted)' }}>Low Stock</p>
                            <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--fg)' }}>{lowStockItems}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--muted)' }} />
                <input
                    type="text"
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm md:text-base"
                    style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--fg)'
                    }}
                />
            </div>

            {/* Inventory List */}
            <InventoryList items={filteredItems} onUpdate={loadItems} loading={loading} />

            {/* Add Dialog */}
            {showAddDialog && (
                <AddItemDialog
                    onClose={() => setShowAddDialog(false)}
                    onSuccess={loadItems}
                />
            )}
        </div>
    );
}
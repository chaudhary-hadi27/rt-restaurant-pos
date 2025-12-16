// src/app/(dashboard)/inventory/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryCategory } from '@/types';
import { Plus } from 'lucide-react';
import { getStockStatus } from '@/lib/utils/stockHelpers';

// Components
import PasswordGate from '@/components/inventory/PasswordGate';
import StockAnalytics from '@/components/inventory/StockAnalytics';
import InventoryFilters from '@/components/inventory/InventoryFilters';
import InventoryTable from '@/components/inventory/InventoryTable';
import ItemDialog from '@/components/inventory/ItemDialog';
import DeleteDialog from '@/components/inventory/DeleteDialog';

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [stockFilter, setStockFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | null; item?: InventoryItem }>({ type: null });
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        if (isAuth) {
            loadCategories();
            loadItems();
            const channel = supabase.channel('inventory_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => loadItems()).subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [isAuth]);

    const loadCategories = async () => {
        const { data } = await supabase.from('inventory_categories').select('*').eq('is_active', true).order('display_order');
        setCategories(data || []);
    };

    const loadItems = async () => {
        setLoading(true);
        const { data } = await supabase.from('inventory_items_with_category').select('*').eq('is_active', true).order('created_at', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    const handleSubmit = async (formData: any) => {
        const data = { category_id: formData.category_id || null, name: formData.name.trim(), description: formData.description?.trim() || null, image_url: formData.image_url?.trim() || null, quantity: parseFloat(formData.quantity), unit: formData.unit.trim(), reorder_level: parseFloat(formData.reorder_level), purchase_price: parseFloat(formData.purchase_price), supplier_name: formData.supplier_name?.trim() || null, storage_location: formData.storage_location?.trim() || null };
        if (dialog.type === 'edit' && dialog.item) await supabase.from('inventory_items').update(data).eq('id', dialog.item.id);
        else await supabase.from('inventory_items').insert(data);
        await loadItems();
        setDialog({ type: null });
    };

    const handleDelete = async () => {
        if (!dialog.item) return;
        await supabase.from('inventory_items').delete().eq('id', dialog.item.id);
        await loadItems();
        setDialog({ type: null });
    };

    const filtered = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
        const matchStock = stockFilter === 'all' || getStockStatus(item) === stockFilter;
        return matchSearch && matchCategory && matchStock;
    });

    const stockStats = { critical: items.filter(i => getStockStatus(i) === 'critical').length, low: items.filter(i => getStockStatus(i) === 'low').length, medium: items.filter(i => getStockStatus(i) === 'medium').length, high: items.filter(i => getStockStatus(i) === 'high').length };
    const stats = { total: filtered.length, value: filtered.reduce((s, i) => s + (i.total_value || 0), 0) };

    if (!isAuth) return <PasswordGate onAuthenticated={() => setIsAuth(true)} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Inventory</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{stats.total} items · PKR {stats.value.toLocaleString()} total value</p>
                </div>
                <button onClick={() => setDialog({ type: 'add' })} className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            <StockAnalytics stats={stockStats} selectedFilter={stockFilter} onFilterChange={setStockFilter} />
            <InventoryFilters search={search} onSearchChange={setSearch} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} categories={categories} />
            <InventoryTable items={filtered} loading={loading} onEdit={(item) => setDialog({ type: 'edit', item })} onDelete={(item) => setDialog({ type: 'delete', item })} />

            {(dialog.type === 'add' || dialog.type === 'edit') && <ItemDialog item={dialog.item} categories={categories} onClose={() => setDialog({ type: null })} onSubmit={handleSubmit} />}
            {dialog.type === 'delete' && dialog.item && <DeleteDialog item={dialog.item} onClose={() => setDialog({ type: null })} onDelete={handleDelete} />}
        </div>
    );
}
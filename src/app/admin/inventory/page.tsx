// src/app/admin/inventory/page.tsx - WITH CATEGORY MANAGEMENT
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryCategory } from '@/types';
import { Plus, FolderPlus, Edit2, Trash2, X } from 'lucide-react';
import { getStockStatus } from '@/lib/utils/stockHelpers';

// Components
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
    const [dialog, setDialog] = useState<{
        type: 'add' | 'edit' | 'delete' | 'add-category' | 'edit-category' | 'delete-category' | null;
        item?: InventoryItem;
        category?: InventoryCategory;
    }>({ type: null });
    const [loading, setLoading] = useState(true);
    const [showCategories, setShowCategories] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadCategories();
        loadItems();
        const channel = supabase
            .channel('inventory_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, loadItems)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_categories' }, loadCategories)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadCategories = async () => {
        const { data } = await supabase
            .from('inventory_categories')
            .select('*')
            .order('display_order');
        setCategories(data || []);
    };

    const loadItems = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('inventory_items_with_category')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    const handleSubmit = async (formData: any) => {
        const data = {
            category_id: formData.category_id || null,
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            image_url: formData.image_url?.trim() || null,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit.trim(),
            reorder_level: parseFloat(formData.reorder_level),
            purchase_price: parseFloat(formData.purchase_price),
            supplier_name: formData.supplier_name?.trim() || null,
            storage_location: formData.storage_location?.trim() || null
        };

        if (dialog.type === 'edit' && dialog.item) {
            await supabase.from('inventory_items').update(data).eq('id', dialog.item.id);
        } else {
            await supabase.from('inventory_items').insert(data);
        }

        await loadItems();
        setDialog({ type: null });
    };

    const handleDelete = async () => {
        if (!dialog.item) return;
        await supabase.from('inventory_items').delete().eq('id', dialog.item.id);
        await loadItems();
        setDialog({ type: null });
    };

    const handleCategorySubmit = async (formData: any) => {
        const data = {
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            icon: formData.icon || '📦',
            color: formData.color || null,
            display_order: parseInt(formData.display_order) || 0,
            is_active: formData.is_active ?? true
        };

        if (dialog.type === 'edit-category' && dialog.category) {
            await supabase.from('inventory_categories').update(data).eq('id', dialog.category.id);
        } else {
            await supabase.from('inventory_categories').insert(data);
        }

        await loadCategories();
        setDialog({ type: null });
    };

    const handleCategoryDelete = async () => {
        if (!dialog.category) return;
        await supabase.from('inventory_categories').delete().eq('id', dialog.category.id);
        await loadCategories();
        setDialog({ type: null });
    };

    const filtered = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
        const matchStock = stockFilter === 'all' || getStockStatus(item) === stockFilter;
        return matchSearch && matchCategory && matchStock;
    });

    const stockStats = {
        critical: items.filter(i => getStockStatus(i) === 'critical').length,
        low: items.filter(i => getStockStatus(i) === 'low').length,
        medium: items.filter(i => getStockStatus(i) === 'medium').length,
        high: items.filter(i => getStockStatus(i) === 'high').length
    };

    const stats = {
        total: filtered.length,
        value: filtered.reduce((s, i) => s + (i.total_value || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Inventory</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        {stats.total} items · PKR {stats.value.toLocaleString()} total value
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCategories(!showCategories)}
                        className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium border"
                        style={{
                            backgroundColor: showCategories ? 'var(--accent-subtle)' : 'var(--card)',
                            color: showCategories ? 'var(--accent)' : 'var(--fg)',
                            borderColor: 'var(--border)'
                        }}
                    >
                        <FolderPlus className="w-4 h-4" /> Categories
                    </button>
                    <button
                        onClick={() => setDialog({ type: 'add' })}
                        className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </div>
            </div>

            {/* Categories Management Panel */}
            {showCategories && (
                <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                            Manage Categories ({categories.length})
                        </h3>
                        <button
                            onClick={() => setDialog({ type: 'add-category' })}
                            className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                        >
                            <Plus className="w-4 h-4" /> Add Category
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className="p-4 rounded-lg border"
                                style={{ backgroundColor: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{cat.icon}</span>
                                        <div>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
                                                {cat.name}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                                {items.filter(i => i.category_id === cat.id).length} items
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${cat.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                        {cat.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setDialog({ type: 'edit-category', category: cat })}
                                        className="flex-1 px-2 py-1.5 rounded text-xs font-medium"
                                        style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDialog({ type: 'delete-category', category: cat })}
                                        className="px-2 py-1.5 rounded text-xs font-medium"
                                        style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <StockAnalytics stats={stockStats} selectedFilter={stockFilter} onFilterChange={setStockFilter} />
            <InventoryFilters
                search={search}
                onSearchChange={setSearch}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
            />
            <InventoryTable
                items={filtered}
                loading={loading}
                onEdit={(item) => setDialog({ type: 'edit', item })}
                onDelete={(item) => setDialog({ type: 'delete', item })}
            />

            {/* Item Dialogs */}
            {(dialog.type === 'add' || dialog.type === 'edit') && (
                <ItemDialog
                    item={dialog.item}
                    categories={categories}
                    onClose={() => setDialog({ type: null })}
                    onSubmit={handleSubmit}
                />
            )}
            {dialog.type === 'delete' && dialog.item && (
                <DeleteDialog
                    item={dialog.item}
                    onClose={() => setDialog({ type: null })}
                    onDelete={handleDelete}
                />
            )}

            {/* Category Dialogs */}
            {(dialog.type === 'add-category' || dialog.type === 'edit-category') && (
                <CategoryDialog
                    category={dialog.category}
                    onClose={() => setDialog({ type: null })}
                    onSubmit={handleCategorySubmit}
                />
            )}
            {dialog.type === 'delete-category' && dialog.category && (
                <CategoryDeleteDialog
                    category={dialog.category}
                    onClose={() => setDialog({ type: null })}
                    onDelete={handleCategoryDelete}
                />
            )}
        </div>
    );
}

// Category Dialog Component
function CategoryDialog({ category, onClose, onSubmit }: any) {
    const [form, setForm] = useState({
        name: category?.name || '',
        description: category?.description || '',
        icon: category?.icon || '📦',
        color: category?.color || '',
        display_order: category?.display_order?.toString() || '0',
        is_active: category?.is_active ?? true
    });

    const iconOptions = ['📦', '🥩', '🥬', '🥛', '🍞', '🧂', '🍶', '🧊', '🧃', '🍱'];

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                        {category ? 'Edit' : 'Add'} Category
                    </h3>
                    <button onClick={onClose}>
                        <X className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            placeholder="Vegetables"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Icon</label>
                        <div className="grid grid-cols-5 gap-2">
                            {iconOptions.map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => setForm({ ...form, icon })}
                                    className="p-3 rounded-lg border text-2xl"
                                    style={{
                                        backgroundColor: form.icon === icon ? 'var(--accent-subtle)' : 'var(--bg)',
                                        borderColor: form.icon === icon ? 'var(--accent)' : 'var(--border)'
                                    }}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                            placeholder="Fresh vegetables and produce"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Display Order</label>
                        <input
                            type="number"
                            value={form.display_order}
                            onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border"
                            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Active</span>
                        <button
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
                        >
                            <span
                                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
                                style={{ transform: form.is_active ? 'translateX(20px)' : 'translateX(0)' }}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(form)}
                        className="flex-1 px-4 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        {category ? 'Save' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Category Delete Dialog
function CategoryDeleteDialog({ category, onClose, onDelete }: any) {
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-xl w-full max-w-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                        Delete "{category.name}"?
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        This will not delete items in this category, but they will become uncategorized.
                    </p>
                </div>
                <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--fg)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex-1 px-4 py-2 rounded-lg"
                        style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
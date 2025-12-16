// src/app/admin/page.tsx - WITH REAL DATABASE DATA
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Package,
    Users,
    LayoutGrid,
    ShoppingBag,
    UtensilsCrossed,
    DollarSign,
    TrendingUp,
    Clock,
    ArrowRight,
    AlertCircle
} from 'lucide-react';

export default function AdminHomePage() {
    const [stats, setStats] = useState({
        inventory: { total: 0, lowStock: 0, value: 0, critical: 0 },
        waiters: { total: 0, onDuty: 0, revenue: 0 },
        tables: { total: 0, occupied: 0, available: 0 },
        orders: { today: 0, pending: 0, revenue: 0, completed: 0 },
        menu: { total: 0, available: 0, categories: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        loadStats();
        loadRecentActivity();

        // Real-time updates
        const channel = supabase
            .channel('dashboard_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadStats)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, loadStats)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waiters' }, loadStats)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadStats = async () => {
        setLoading(true);

        const [
            inventoryItems,
            inventoryCategories,
            waiters,
            tables,
            orders,
            menuItems,
            menuCategories
        ] = await Promise.all([
            supabase.from('inventory_items').select('quantity, reorder_level, purchase_price').eq('is_active', true),
            supabase.from('inventory_categories').select('id').eq('is_active', true),
            supabase.from('waiters').select('is_active, is_on_duty'),
            supabase.from('restaurant_tables').select('status'),
            supabase.from('orders').select('status, total_amount, created_at'),
            supabase.from('menu_items').select('is_available'),
            supabase.from('menu_categories').select('id').eq('is_active', true)
        ]);

        // Inventory Stats
        const inventoryData = inventoryItems.data || [];
        const lowStock = inventoryData.filter(i => i.quantity <= i.reorder_level).length;
        const critical = inventoryData.filter(i => i.quantity <= (i.reorder_level * 0.5)).length;
        const inventoryValue = inventoryData.reduce((sum, i) => sum + (i.quantity * i.purchase_price), 0);

        // Waiter Stats
        const waiterData = waiters.data || [];
        const activeWaiters = waiterData.filter(w => w.is_active).length;
        const onDuty = waiterData.filter(w => w.is_on_duty).length;

        // Table Stats
        const tableData = tables.data || [];
        const occupied = tableData.filter(t => t.status === 'occupied').length;
        const available = tableData.filter(t => t.status === 'available').length;

        // Order Stats (Today)
        const orderData = orders.data || [];
        const today = new Date().toDateString();
        const todayOrders = orderData.filter(o => new Date(o.created_at).toDateString() === today);
        const pending = orderData.filter(o => o.status === 'pending' || o.status === 'preparing').length;
        const completed = todayOrders.filter(o => o.status === 'completed').length;
        const orderRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Menu Stats
        const menuData = menuItems.data || [];
        const menuAvailable = menuData.filter(m => m.is_available).length;
        const menuCategoriesCount = menuCategories.data?.length || 0;

        setStats({
            inventory: {
                total: inventoryData.length,
                lowStock,
                critical,
                value: inventoryValue
            },
            waiters: {
                total: activeWaiters,
                onDuty,
                revenue: 0 // Will be calculated from completed orders
            },
            tables: {
                total: tableData.length,
                occupied,
                available
            },
            orders: {
                today: todayOrders.length,
                pending,
                completed,
                revenue: orderRevenue
            },
            menu: {
                total: menuData.length,
                available: menuAvailable,
                categories: menuCategoriesCount
            }
        });

        setLoading(false);
    };

    const loadRecentActivity = async () => {
        const { data } = await supabase
            .from('orders')
            .select('id, order_number, status, total_amount, created_at, restaurant_tables(table_number), waiters(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        setRecentActivity(data || []);
    };

    const quickLinks = [
        {
            title: 'Inventory',
            description: 'Manage stock and supplies',
            icon: Package,
            href: '/admin/inventory',
            color: 'var(--accent)',
            stats: [
                { label: 'Total Items', value: stats.inventory.total },
                { label: 'Low Stock', value: stats.inventory.lowStock, alert: stats.inventory.lowStock > 0 },
                { label: 'Critical', value: stats.inventory.critical, alert: stats.inventory.critical > 0 },
                { label: 'Total Value', value: `PKR ${stats.inventory.value.toLocaleString()}` }
            ]
        },
        {
            title: 'Menu',
            description: 'Update menu items & prices',
            icon: UtensilsCrossed,
            href: '/admin/menu',
            color: '#f59e0b',
            stats: [
                { label: 'Total Items', value: stats.menu.total },
                { label: 'Available', value: stats.menu.available },
                { label: 'Categories', value: stats.menu.categories }
            ]
        },
        {
            title: 'Waiters',
            description: 'Staff management',
            icon: Users,
            href: '/admin/waiters',
            color: '#10b981',
            stats: [
                { label: 'Active Staff', value: stats.waiters.total },
                { label: 'On Duty', value: stats.waiters.onDuty },
                { label: 'Available', value: stats.waiters.total - stats.waiters.onDuty }
            ]
        },
        {
            title: 'Tables',
            description: 'Table assignments',
            icon: LayoutGrid,
            href: '/admin/tables',
            color: '#3b82f6',
            stats: [
                { label: 'Total Tables', value: stats.tables.total },
                { label: 'Occupied', value: stats.tables.occupied },
                { label: 'Available', value: stats.tables.available }
            ]
        },
        {
            title: 'Orders',
            description: 'Track & manage orders',
            icon: ShoppingBag,
            href: '/admin/orders',
            color: '#ec4899',
            stats: [
                { label: 'Today', value: stats.orders.today },
                { label: 'Pending', value: stats.orders.pending, alert: stats.orders.pending > 0 },
                { label: 'Completed', value: stats.orders.completed },
                { label: 'Revenue', value: `PKR ${stats.orders.revenue.toLocaleString()}` }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--fg)' }}>
                    Restaurant Dashboard
                </h1>
                <p style={{ color: 'var(--muted)' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Alerts */}
            {(stats.inventory.critical > 0 || stats.orders.pending > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.inventory.critical > 0 && (
                        <div className="p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: '#ef444410', borderColor: '#ef4444' }}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                            <div>
                                <p className="font-semibold text-sm" style={{ color: '#ef4444' }}>Critical Stock Alert</p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{stats.inventory.critical} items need immediate restocking</p>
                            </div>
                            <Link href="/admin/inventory" className="ml-auto">
                                <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                                    View
                                </button>
                            </Link>
                        </div>
                    )}
                    {stats.orders.pending > 0 && (
                        <div className="p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: '#f59e0b10', borderColor: '#f59e0b' }}>
                            <Clock className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                            <div>
                                <p className="font-semibold text-sm" style={{ color: '#f59e0b' }}>Pending Orders</p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{stats.orders.pending} orders waiting</p>
                            </div>
                            <Link href="/admin/orders" className="ml-auto">
                                <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                                    View
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Today's Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={ShoppingBag}
                    label="Orders Today"
                    value={stats.orders.today}
                    color="#ec4899"
                    trend={stats.orders.completed > 0 ? `${stats.orders.completed} completed` : undefined}
                />
                <StatCard
                    icon={DollarSign}
                    label="Revenue Today"
                    value={`PKR ${stats.orders.revenue.toLocaleString()}`}
                    color="#10b981"
                    trend={stats.orders.today > 0 ? `Avg: PKR ${(stats.orders.revenue / stats.orders.today).toFixed(0)}` : undefined}
                />
                <StatCard
                    icon={Users}
                    label="Staff On Duty"
                    value={stats.waiters.onDuty}
                    total={stats.waiters.total}
                    color="var(--accent)"
                />
                <StatCard
                    icon={Clock}
                    label="Pending Orders"
                    value={stats.orders.pending}
                    color="#f59e0b"
                    alert={stats.orders.pending > 0}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Links - 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Quick Access</h3>
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
                                 style={{ borderColor: 'var(--accent)' }}></div>
                            <p className="mt-4" style={{ color: 'var(--muted)' }}>Loading dashboard...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quickLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link key={link.href} href={link.href}>
                                        <div
                                            className="p-5 rounded-xl border transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: 'var(--card)',
                                                borderColor: 'var(--border)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.borderColor = link.color;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: `${link.color}20` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: link.color }} />
                                                </div>
                                                <ArrowRight className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                                            </div>

                                            <h3 className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                                                {link.title}
                                            </h3>
                                            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                                                {link.description}
                                            </p>

                                            <div className="space-y-1.5">
                                                {link.stats.map((stat, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs">
                                                        <span style={{ color: 'var(--muted)' }}>{stat.label}</span>
                                                        <span
                                                            className="font-semibold"
                                                            style={{ color: stat.alert ? '#ef4444' : 'var(--fg)' }}
                                                        >
                                                            {stat.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Activity - 1 column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Recent Orders</h3>
                    <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
                                    No recent orders
                                </p>
                            ) : (
                                recentActivity.map(order => (
                                    <div key={order.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                                                    #{order.order_number || order.id.slice(0, 8)}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                                    Table {order.restaurant_tables?.table_number} · {order.waiters?.name}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                                order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    order.status === 'preparing' ? 'bg-blue-500/20 text-blue-500' :
                                                        order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                            'bg-gray-500/20 text-gray-500'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </span>
                                            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                                                PKR {order.total_amount.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link href="/admin/orders">
                            <button className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium"
                                    style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                                View All Orders
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, total, color, alert, trend }: any) {
    return (
        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5" style={{ color }} />
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
            <div className="flex items-baseline gap-2">
                <p
                    className="text-2xl font-bold"
                    style={{ color: alert ? '#ef4444' : 'var(--fg)' }}
                >
                    {value}
                </p>
                {total && (
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>/ {total}</span>
                )}
            </div>
            {trend && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{trend}</p>
            )}
        </div>
    );
}
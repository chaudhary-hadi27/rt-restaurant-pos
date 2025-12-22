-- ============================================
-- RT RESTAURANT MANAGEMENT SYSTEM
-- Complete Database Schema
-- ============================================

-- ============================================
-- 1. ADMIN & AUTHENTICATION
-- ============================================

CREATE TABLE admin_config (
                              id INT PRIMARY KEY DEFAULT 1,
                              password_hash TEXT NOT NULL,
                              created_at TIMESTAMPTZ DEFAULT NOW(),
                              updated_at TIMESTAMPTZ DEFAULT NOW(),
                              CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default admin (password: admin123)
-- ⚠️ CHANGE THIS IN PRODUCTION!
INSERT INTO admin_config (id, password_hash)
VALUES (1, '$2a$10$rH5VqaJWK5lZ7HnQYqZHxOX8pV6QqJ5jKfCKLqhwX9YqZHxOX8pV6Q')
    ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STAFF MANAGEMENT
-- ============================================

CREATE TABLE waiters (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         name TEXT NOT NULL,
                         phone TEXT,
                         cnic TEXT,
                         employee_type TEXT DEFAULT 'waiter'
                             CHECK (employee_type IN ('waiter', 'chef', 'manager', 'cashier', 'cleaner')),
                         profile_pic TEXT,
                         total_orders INT DEFAULT 0,
                         total_revenue NUMERIC(10, 2) DEFAULT 0,
                         avg_rating NUMERIC(2, 1),
                         is_active BOOLEAN DEFAULT true,
                         is_on_duty BOOLEAN DEFAULT false,
                         created_at TIMESTAMPTZ DEFAULT NOW(),
                         updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_waiters_active ON waiters(is_active);
CREATE INDEX idx_waiters_on_duty ON waiters(is_on_duty);

CREATE TABLE waiter_shifts (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               waiter_id UUID REFERENCES waiters(id) ON DELETE CASCADE,
                               clock_in TIMESTAMPTZ NOT NULL,
                               clock_out TIMESTAMPTZ,
                               created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date filtering
CREATE INDEX idx_waiter_shifts_date ON waiter_shifts(clock_in);

-- ============================================
-- 3. TABLES & SEATING
-- ============================================

CREATE TABLE restaurant_tables (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   table_number INT UNIQUE NOT NULL,
                                   capacity INT NOT NULL,
                                   section TEXT DEFAULT 'Main',
                                   status TEXT DEFAULT 'available'
                                       CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
                                   waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                                   current_order_id UUID,
                                   created_at TIMESTAMPTZ DEFAULT NOW(),
                                   updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_tables_status ON restaurant_tables(status);
CREATE INDEX idx_tables_number ON restaurant_tables(table_number);

-- ============================================
-- 4. MENU MANAGEMENT
-- ============================================

CREATE TABLE menu_categories (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 name TEXT NOT NULL,
                                 icon TEXT DEFAULT '📋',
                                 display_order INT DEFAULT 0,
                                 is_active BOOLEAN DEFAULT true,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX idx_menu_categories_order ON menu_categories(display_order);

CREATE TABLE menu_items (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
                            name TEXT NOT NULL,
                            description TEXT,
                            price NUMERIC(10, 2) NOT NULL,
                            image_url TEXT,
                            is_available BOOLEAN DEFAULT true,
                            preparation_time INT,
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- ============================================
-- 5. ORDERS & TRANSACTIONS
-- ============================================

CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
                        waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                        status TEXT DEFAULT 'pending'
                            CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
                        order_type TEXT DEFAULT 'dine-in'
                            CHECK (order_type IN ('dine-in', 'delivery')),
                        payment_method TEXT DEFAULT 'cash'
                            CHECK (payment_method IN ('cash', 'online')),
                        receipt_printed BOOLEAN DEFAULT false,

    -- Amounts
                        subtotal NUMERIC(10, 2) NOT NULL,
                        tax NUMERIC(10, 2) NOT NULL,
                        total_amount NUMERIC(10, 2) NOT NULL,

    -- Delivery details (for delivery orders)
                        customer_name TEXT,
                        customer_phone TEXT,
                        delivery_address TEXT,
                        delivery_charges NUMERIC(10, 2) DEFAULT 0,

    -- Additional
                        notes TEXT,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at DESC);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_payment ON orders(payment_method);

CREATE TABLE order_items (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                             menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
                             quantity INT NOT NULL,
                             unit_price NUMERIC(10, 2) NOT NULL,
                             total_price NUMERIC(10, 2) NOT NULL,
                             notes TEXT,
                             status TEXT DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
                             created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order lookups
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- 6. INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE inventory_categories (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                      name TEXT NOT NULL,
                                      icon TEXT DEFAULT '📦',
                                      display_order INT DEFAULT 0,
                                      is_active BOOLEAN DEFAULT true,
                                      created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX idx_inventory_categories_order ON inventory_categories(display_order);

CREATE TABLE inventory_items (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
                                 name TEXT NOT NULL,
                                 description TEXT,
                                 image_url TEXT,
                                 quantity NUMERIC(10, 2) NOT NULL,
                                 unit TEXT NOT NULL,
                                 reorder_level NUMERIC(10, 2) DEFAULT 10,
                                 purchase_price NUMERIC(10, 2) NOT NULL,
                                 supplier_name TEXT,
                                 storage_location TEXT,
                                 is_active BOOLEAN DEFAULT true,
                                 created_at TIMESTAMPTZ DEFAULT NOW(),
                                 updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_stock ON inventory_items(quantity);

CREATE TABLE inventory_usage (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
                                 quantity_used NUMERIC(10, 2) NOT NULL,
                                 cost NUMERIC(10, 2) NOT NULL,
                                 used_by UUID REFERENCES waiters(id) ON DELETE SET NULL,
                                 notes TEXT,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date filtering
CREATE INDEX idx_inventory_usage_date ON inventory_usage(created_at);

-- ============================================
-- 7. ANALYTICS & REPORTING
-- ============================================

CREATE TABLE daily_summaries (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 date DATE UNIQUE NOT NULL,
                                 total_orders INT DEFAULT 0,
                                 total_revenue NUMERIC(10, 2) DEFAULT 0,
                                 total_cost NUMERIC(10, 2) DEFAULT 0,
                                 net_profit NUMERIC(10, 2) DEFAULT 0,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX idx_daily_summaries_date ON daily_summaries(date DESC);

-- ============================================
-- 8. DATABASE FUNCTIONS
-- ============================================

-- Function to increment waiter stats
CREATE OR REPLACE FUNCTION increment_waiter_stats(
    p_waiter_id UUID,
    p_orders INT,
    p_revenue NUMERIC
)
RETURNS VOID AS $$
BEGIN
UPDATE waiters
SET
    total_orders = total_orders + p_orders,
    total_revenue = total_revenue + p_revenue,
    updated_at = NOW()
WHERE id = p_waiter_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update order timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_waiters_updated_at BEFORE UPDATE ON waiters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations)
-- ⚠️ For development - tighten in production

CREATE POLICY "Allow all operations" ON admin_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON waiters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON waiter_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON restaurant_tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON menu_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON inventory_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON inventory_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON daily_summaries FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- ============================================

-- Sample Menu Categories
INSERT INTO menu_categories (name, icon, display_order) VALUES
                                                            ('Appetizers', '🍟', 1),
                                                            ('Main Course', '🍽️', 2),
                                                            ('Beverages', '🥤', 3),
                                                            ('Desserts', '🍰', 4)
    ON CONFLICT DO NOTHING;

-- Sample Inventory Categories
INSERT INTO inventory_categories (name, icon, display_order) VALUES
                                                                 ('Vegetables', '🥬', 1),
                                                                 ('Meat & Protein', '🥩', 2),
                                                                 ('Dairy', '🥛', 3),
                                                                 ('Grains', '🌾', 4)
    ON CONFLICT DO NOTHING;

-- Sample Tables
INSERT INTO restaurant_tables (table_number, capacity, section, status) VALUES
                                                                            (1, 4, 'Main', 'available'),
                                                                            (2, 4, 'Main', 'available'),
                                                                            (3, 2, 'Main', 'available'),
                                                                            (4, 6, 'Outdoor', 'available'),
                                                                            (5, 8, 'VIP', 'available')
    ON CONFLICT DO NOTHING;

-- ============================================
-- 11. VIEWS FOR REPORTING
-- ============================================

-- View: Active Orders with Details
CREATE OR REPLACE VIEW active_orders_view AS
SELECT
    o.id,
    o.created_at,
    o.status,
    o.order_type,
    o.payment_method,
    o.total_amount,
    t.table_number,
    t.section,
    w.name as waiter_name,
    COUNT(oi.id) as item_count
FROM orders o
         LEFT JOIN restaurant_tables t ON o.table_id = t.id
         LEFT JOIN waiters w ON o.waiter_id = w.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status IN ('pending', 'preparing')
GROUP BY o.id, t.table_number, t.section, w.name;

-- View: Low Stock Items
CREATE OR REPLACE VIEW low_stock_items AS
SELECT
    i.id,
    i.name,
    i.quantity,
    i.unit,
    i.reorder_level,
    i.purchase_price,
    ic.name as category_name,
    (i.quantity / i.reorder_level * 100) as stock_percentage
FROM inventory_items i
         LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true
  AND i.quantity <= i.reorder_level
ORDER BY stock_percentage ASC;

-- View: Waiter Performance Today
CREATE OR REPLACE VIEW waiter_performance_today AS
SELECT
    w.id,
    w.name,
    w.profile_pic,
    w.is_on_duty,
    COUNT(DISTINCT o.id) as orders_today,
    SUM(o.total_amount) as revenue_today
FROM waiters w
         LEFT JOIN orders o ON w.id = o.waiter_id
    AND DATE(o.created_at) = CURRENT_DATE
    AND o.status = 'completed'
WHERE w.is_active = true
GROUP BY w.id, w.name, w.profile_pic, w.is_on_duty
ORDER BY revenue_today DESC NULLS LAST;

-- ============================================
-- 12. PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Analyze tables for query optimization
ANALYZE waiters;
ANALYZE restaurant_tables;
ANALYZE orders;
ANALYZE order_items;
ANALYZE menu_items;
ANALYZE inventory_items;

-- ============================================
-- SCHEMA COMPLETE ✅
-- ============================================
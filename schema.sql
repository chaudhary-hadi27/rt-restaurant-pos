-- ============================================
-- RT RESTAURANT - COMPLETE PRODUCTION SCHEMA
-- Version: 2.0 (Optimized + Auto-Cleanup)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ADMIN AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS admin_config (
                                            id INTEGER PRIMARY KEY DEFAULT 1,
                                            password_hash TEXT NOT NULL,
                                            created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_admin CHECK (id = 1)
    );

-- Default password: admin123
INSERT INTO admin_config (id, password_hash) VALUES (1, '$2a$10$rK.Xm9vL8qY3Z2fJ4xH6ZO7WqY3tL8kM5nN9pP2qQ3rR4sS5tT6uU')
    ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. MENU SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS menu_categories (
                                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '📋',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS menu_items (
                                          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

-- ============================================
-- 3. RESTAURANT OPERATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
                                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number INTEGER NOT NULL UNIQUE CHECK (table_number > 0),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    section VARCHAR(50) DEFAULT 'Main',
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
    waiter_id UUID,
    current_order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS waiters (
                                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    cnic VARCHAR(20),
    employee_type VARCHAR(20) DEFAULT 'waiter' CHECK (employee_type IN ('waiter', 'chef', 'manager', 'cashier', 'cleaner')),
    profile_pic TEXT,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_on_duty BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

-- ============================================
-- 4. ORDERS SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
                                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
    order_type VARCHAR(20) DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'delivery')),

    -- Delivery fields
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    delivery_address TEXT,
    delivery_charges DECIMAL(10, 2) DEFAULT 0,

    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),

    -- Payment
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'online', NULL)),
    receipt_printed BOOLEAN DEFAULT false,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS order_items (
                                           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

-- ============================================
-- 5. INVENTORY SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_categories (
                                                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '📦',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS inventory_items (
                                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'gram', 'liter', 'ml', 'pieces', 'dozen')),
    reorder_level DECIMAL(10, 2) DEFAULT 10,
    purchase_price DECIMAL(10, 2) NOT NULL CHECK (purchase_price >= 0),
    supplier_name VARCHAR(200),
    storage_location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS inventory_usage (
                                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    used_by UUID REFERENCES waiters(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

-- ============================================
-- 6. ATTENDANCE SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS waiter_shifts (
                                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    waiter_id UUID NOT NULL REFERENCES waiters(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

-- ============================================
-- 7. ANALYTICS & REPORTING
-- ============================================
CREATE TABLE IF NOT EXISTS daily_summaries (
                                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_tax DECIMAL(10, 2) DEFAULT 0,
    inventory_cost DECIMAL(10, 2) DEFAULT 0,
    net_profit DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

-- ============================================
-- INDEXES (Performance Optimization)
-- ============================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_status ON orders(waiter_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(order_type, status, created_at DESC);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_menu ON order_items(order_id, menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status) WHERE status != 'served';

-- Menu indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_available_category ON menu_items(is_available, category_id) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_name_search ON menu_items USING gin(to_tsvector('english', name));

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items(quantity, reorder_level) WHERE is_active = true AND quantity <= reorder_level;
CREATE INDEX IF NOT EXISTS idx_inventory_usage_date ON inventory_usage(created_at DESC, inventory_item_id);

-- Waiter indexes
CREATE INDEX IF NOT EXISTS idx_shifts_waiter_date ON waiter_shifts(waiter_id, clock_in DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON waiter_shifts(waiter_id) WHERE clock_out IS NULL;

-- Table indexes
CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_number ON restaurant_tables(table_number);

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================

-- Increment waiter stats
CREATE OR REPLACE FUNCTION increment_waiter_stats(
    p_waiter_id UUID,
    p_orders INTEGER,
    p_revenue DECIMAL
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

-- Get table status
CREATE OR REPLACE FUNCTION get_table_status(p_table_id UUID)
RETURNS TABLE (
    status VARCHAR,
    current_order_id UUID,
    waiter_id UUID,
    order_amount DECIMAL
) AS $$
BEGIN
RETURN QUERY
SELECT
    t.status,
    t.current_order_id,
    t.waiter_id,
    o.total_amount
FROM restaurant_tables t
         LEFT JOIN orders o ON t.current_order_id = o.id
WHERE t.id = p_table_id;
END;
$$ LANGUAGE plpgsql;

-- Auto clock-in waiter
CREATE OR REPLACE FUNCTION auto_clock_in_waiter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.waiter_id IS NOT NULL THEN
UPDATE waiters
SET is_on_duty = true
WHERE id = NEW.waiter_id AND is_on_duty = false;

INSERT INTO waiter_shifts (waiter_id, clock_in)
SELECT NEW.waiter_id, NOW()
    WHERE NOT EXISTS (
            SELECT 1 FROM waiter_shifts
            WHERE waiter_id = NEW.waiter_id
            AND clock_in::DATE = CURRENT_DATE
            AND clock_out IS NULL
        );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_clock_in_on_order
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION auto_clock_in_waiter();

-- ============================================
-- AUTO-CLEANUP (Runs daily at midnight)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_orders()
RETURNS INTEGER AS $$
DECLARE
deleted_count INTEGER;
BEGIN
WITH deleted AS (
DELETE FROM orders
WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '30 days'
    RETURNING id
    )
SELECT COUNT(*) INTO deleted_count FROM deleted;

RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (PostgreSQL cron extension - optional)
-- If you don't have pg_cron, run this monthly manually
-- SELECT cron.schedule('cleanup-old-orders', '0 0 * * *', 'SELECT cleanup_old_orders()');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Public read for menu
CREATE POLICY "Anyone can view menu categories" ON menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view menu items" ON menu_items FOR SELECT USING (is_available = true);

-- Service role full access
CREATE POLICY "Service role full access menu_categories" ON menu_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access menu_items" ON menu_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access tables" ON restaurant_tables FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access waiters" ON waiters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access order_items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access inventory_items" ON inventory_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access inventory_usage" ON inventory_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access waiter_shifts" ON waiter_shifts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access daily_summaries" ON daily_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
INSERT INTO menu_categories (name, icon, display_order) VALUES
                                                            ('Fast Food', '🍔', 1),
                                                            ('Main Course', '🍛', 2),
                                                            ('Beverages', '☕', 3),
                                                            ('Desserts', '🍰', 4)
    ON CONFLICT DO NOTHING;

INSERT INTO inventory_categories (name, icon, display_order) VALUES
                                                                 ('Vegetables', '🥬', 1),
                                                                 ('Meat', '🍖', 2),
                                                                 ('Dairy', '🥛', 3),
                                                                 ('Spices', '🌶️', 4)
    ON CONFLICT DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, section) VALUES
                                                                    (1, 4, 'Main'),
                                                                    (2, 2, 'Main'),
                                                                    (3, 6, 'VIP'),
                                                                    (4, 4, 'Outdoor')
    ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 'Schema setup complete!' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public';

-- Check sample data
SELECT
    (SELECT COUNT(*) FROM menu_categories) as categories,
    (SELECT COUNT(*) FROM inventory_categories) as inventory_categories,
    (SELECT COUNT(*) FROM restaurant_tables) as tables;

-- ============================================
-- MAINTENANCE COMMANDS (Run monthly)
-- ============================================
-- 1. Clean old orders (keep 30 days):
SELECT cleanup_old_orders();

-- 2. Update statistics:
ANALYZE orders;
ANALYZE order_items;
ANALYZE menu_items;
ANALYZE inventory_items;

-- 3. Check database size:
SELECT
    pg_size_pretty(pg_database_size(current_database())) as db_size,
    pg_size_pretty(pg_total_relation_size('orders')) as orders_size,
    (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders;
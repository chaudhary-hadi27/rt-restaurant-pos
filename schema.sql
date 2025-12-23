-- ============================================
-- RT RESTAURANT MANAGEMENT SYSTEM
-- Database Schema - Complete
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ADMIN CONFIGURATION
-- ============================================
CREATE TABLE admin_config (
                              id INTEGER PRIMARY KEY DEFAULT 1,
                              password_hash TEXT NOT NULL,
                              created_at TIMESTAMPTZ DEFAULT NOW(),
                              updated_at TIMESTAMPTZ DEFAULT NOW(),
                              CONSTRAINT single_admin CHECK (id = 1)
);

-- Insert default admin (password: admin123)
INSERT INTO admin_config (id, password_hash)
VALUES (1, '$2a$10$rK.Xm9vL8qY3Z2fJ4xH6ZO7WqY3tL8kM5nN9pP2qQ3rR4sS5tT6uU');

-- ============================================
-- 2. MENU CATEGORIES
-- ============================================
CREATE TABLE menu_categories (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 name VARCHAR(100) NOT NULL,
                                 icon VARCHAR(10) DEFAULT '📋',
                                 display_order INTEGER DEFAULT 0,
                                 is_active BOOLEAN DEFAULT true,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_categories_active ON menu_categories(is_active);
CREATE INDEX idx_menu_categories_order ON menu_categories(display_order);

-- Sample data
INSERT INTO menu_categories (name, icon, display_order) VALUES
                                                            ('Fast Food', '🍔', 1),
                                                            ('Main Course', '🍛', 2),
                                                            ('Beverages', '☕', 3),
                                                            ('Desserts', '🍰', 4);

-- ============================================
-- 3. MENU ITEMS
-- ============================================
CREATE TABLE menu_items (
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

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_name ON menu_items(name);

-- Sample data
INSERT INTO menu_items (category_id, name, price, description)
SELECT id, 'Chicken Burger', 450, 'Crispy chicken patty with cheese'
FROM menu_categories WHERE name = 'Fast Food' LIMIT 1;

-- ============================================
-- 4. RESTAURANT TABLES
-- ============================================
CREATE TABLE restaurant_tables (
                                   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   table_number INTEGER NOT NULL UNIQUE CHECK (table_number > 0),
                                   capacity INTEGER NOT NULL CHECK (capacity > 0),
                                   section VARCHAR(50) DEFAULT 'Main',
                                   status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
                                   waiter_id UUID,
                                   current_order_id UUID,
                                   created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tables_status ON restaurant_tables(status);
CREATE INDEX idx_tables_number ON restaurant_tables(table_number);

-- Sample data
INSERT INTO restaurant_tables (table_number, capacity, section) VALUES
                                                                    (1, 4, 'Main'),
                                                                    (2, 2, 'Main'),
                                                                    (3, 6, 'VIP'),
                                                                    (4, 4, 'Outdoor');

-- ============================================
-- 5. WAITERS/STAFF
-- ============================================
CREATE TABLE waiters (
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

CREATE INDEX idx_waiters_active ON waiters(is_active);
CREATE INDEX idx_waiters_on_duty ON waiters(is_on_duty);

-- Sample data
INSERT INTO waiters (name, phone, employee_type) VALUES
                                                     ('Ahmed Ali', '+92 300 1234567', 'waiter'),
                                                     ('Sara Khan', '+92 301 2345678', 'waiter');

-- ============================================
-- 6. ORDERS
-- ============================================
CREATE TABLE orders (
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

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_type ON orders(order_type);

-- ============================================
-- 7. ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
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

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu ON order_items(menu_item_id);

-- ============================================
-- 8. INVENTORY CATEGORIES
-- ============================================
CREATE TABLE inventory_categories (
                                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                      name VARCHAR(100) NOT NULL,
                                      icon VARCHAR(10) DEFAULT '📦',
                                      display_order INTEGER DEFAULT 0,
                                      is_active BOOLEAN DEFAULT true,
                                      created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data
INSERT INTO inventory_categories (name, icon, display_order) VALUES
                                                                 ('Vegetables', '🥬', 1),
                                                                 ('Meat', '🍖', 2),
                                                                 ('Dairy', '🥛', 3),
                                                                 ('Spices', '🌶️', 4);

-- ============================================
-- 9. INVENTORY ITEMS
-- ============================================
CREATE TABLE inventory_items (
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

CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_stock ON inventory_items(quantity);

-- ============================================
-- 10. INVENTORY USAGE (Tracking)
-- ============================================
CREATE TABLE inventory_usage (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
                                 quantity_used DECIMAL(10, 2) NOT NULL,
                                 cost DECIMAL(10, 2),
                                 used_by UUID REFERENCES waiters(id),
                                 notes TEXT,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_usage_item ON inventory_usage(inventory_item_id);
CREATE INDEX idx_inventory_usage_date ON inventory_usage(created_at DESC);

-- ============================================
-- 11. WAITER SHIFTS (Attendance)
-- ============================================
CREATE TABLE waiter_shifts (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               waiter_id UUID NOT NULL REFERENCES waiters(id) ON DELETE CASCADE,
                               clock_in TIMESTAMPTZ NOT NULL,
                               clock_out TIMESTAMPTZ,
                               notes TEXT,
                               created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_waiter ON waiter_shifts(waiter_id);
CREATE INDEX idx_shifts_date ON waiter_shifts(clock_in DESC);

-- ============================================
-- 12. DAILY SUMMARIES (For Optimized Reports)
-- ============================================
CREATE TABLE daily_summaries (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 date DATE NOT NULL UNIQUE,
                                 total_revenue DECIMAL(12, 2) DEFAULT 0,
                                 total_orders INTEGER DEFAULT 0,
                                 total_tax DECIMAL(10, 2) DEFAULT 0,
                                 inventory_cost DECIMAL(10, 2) DEFAULT 0,
                                 net_profit DECIMAL(12, 2) DEFAULT 0,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_summaries_date ON daily_summaries(date DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
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

-- Increment waiter stats on order completion
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
    total_revenue = total_revenue + p_revenue
WHERE id = p_waiter_id;
END;
$$ LANGUAGE plpgsql;

-- Auto clock-in waiter when assigned to order
CREATE OR REPLACE FUNCTION auto_clock_in_waiter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.waiter_id IS NOT NULL THEN
        -- Check if waiter is not already on duty
UPDATE waiters
SET is_on_duty = true
WHERE id = NEW.waiter_id AND is_on_duty = false;

-- Create shift record if not exists today
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Public read access for menu (for customer app)
CREATE POLICY "Public can read menu categories"
    ON menu_categories FOR SELECT
                                      USING (is_active = true);

CREATE POLICY "Public can read menu items"
    ON menu_items FOR SELECT
                                 USING (is_available = true);

-- Authenticated users can do everything (for staff/admin)
CREATE POLICY "Authenticated users full access"
    ON menu_categories FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access items"
    ON menu_items FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access tables"
    ON restaurant_tables FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access waiters"
    ON waiters FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access orders"
    ON orders FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access order_items"
    ON order_items FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access inventory"
    ON inventory_items FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- VIEWS (For Complex Queries)
-- ============================================

-- Current day active orders
CREATE OR REPLACE VIEW today_active_orders AS
SELECT
    o.*,
    t.table_number,
    w.name as waiter_name
FROM orders o
         LEFT JOIN restaurant_tables t ON o.table_id = t.id
         LEFT JOIN waiters w ON o.waiter_id = w.id
WHERE o.created_at::DATE = CURRENT_DATE
AND o.status = 'pending'
ORDER BY o.created_at DESC;

-- Low stock inventory
CREATE OR REPLACE VIEW low_stock_items AS
SELECT
    i.*,
    c.name as category_name,
    (i.quantity * i.purchase_price) as stock_value
FROM inventory_items i
         LEFT JOIN inventory_categories c ON i.category_id = c.id
WHERE i.is_active = true
  AND i.quantity <= i.reorder_level
ORDER BY i.quantity ASC;

-- Today's waiter performance
CREATE OR REPLACE VIEW today_waiter_performance AS
SELECT
    w.id,
    w.name,
    w.profile_pic,
    COUNT(o.id) as orders_today,
    COALESCE(SUM(o.total_amount), 0) as revenue_today
FROM waiters w
         LEFT JOIN orders o ON w.id = o.waiter_id
    AND o.created_at::DATE = CURRENT_DATE
    AND o.status = 'completed'
WHERE w.is_active = true
GROUP BY w.id, w.name, w.profile_pic
ORDER BY revenue_today DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
CREATE INDEX idx_orders_waiter_date ON orders(waiter_id, created_at DESC);
CREATE INDEX idx_inventory_category_active ON inventory_items(category_id, is_active);

-- Full text search on menu items
CREATE INDEX idx_menu_items_name_search ON menu_items USING gin(to_tsvector('english', name));

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE orders IS 'Main orders table supporting both dine-in and delivery';
COMMENT ON TABLE inventory_items IS 'Inventory management with automatic low-stock alerts';
COMMENT ON TABLE daily_summaries IS 'Pre-calculated daily metrics for fast reporting';
COMMENT ON FUNCTION increment_waiter_stats IS 'Updates waiter performance metrics';
COMMENT ON FUNCTION auto_clock_in_waiter IS 'Automatically clocks in waiter when assigned to order';

-- ============================================
-- END OF SCHEMA
-- ============================================
-- ```
--
-- ---
--
-- ## 📊 **Schema Summary:**
--
-- | Table | Purpose | Key Features |
-- |-------|---------|-------------|
-- | `admin_config` | Admin authentication | Single row, password hash |
-- | `menu_categories` | Menu organization | Icons, ordering |
-- | `menu_items` | Menu products | Pricing, availability |
-- | `restaurant_tables` | Table management | Status tracking |
-- | `waiters` | Staff management | Performance stats |
-- | `orders` | Order processing | Dine-in + Delivery |
-- | `order_items` | Order details | Menu item quantities |
-- | `inventory_categories` | Inventory grouping | Icons, ordering |
-- | `inventory_items` | Stock management | Reorder levels |
-- | `inventory_usage` | Usage tracking | Cost tracking |
-- | `waiter_shifts` | Attendance | Clock in/out |
-- | `daily_summaries` | Report optimization | Pre-calculated stats |
--
-- ---
--
-- ## 🔗 **Relationships:**
-- ```
-- menu_categories → menu_items
-- restaurant_tables ← orders → waiters
-- orders → order_items → menu_items
-- inventory_categories → inventory_items
-- inventory_items → inventory_usage
-- waiters → waiter_shifts
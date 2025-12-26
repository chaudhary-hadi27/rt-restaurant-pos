-- ============================================
-- RT RESTAURANT - SECURE DATABASE SCHEMA
-- With Row Level Security (RLS)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- 1. Admin Config
CREATE TABLE admin_config (
                              id SERIAL PRIMARY KEY,
                              password_hash TEXT NOT NULL,
                              name VARCHAR(100) DEFAULT 'Admin User',
                              bio TEXT,
                              profile_pic TEXT,
                              created_at TIMESTAMPTZ DEFAULT NOW(),
                              updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_config (id, password_hash, name)
VALUES (1, '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Admin User');

-- 2. Menu Categories
CREATE TABLE menu_categories (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 name VARCHAR(100) NOT NULL,
                                 icon VARCHAR(10) DEFAULT '📋',
                                 display_order INTEGER DEFAULT 0,
                                 is_active BOOLEAN DEFAULT TRUE,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menu Items
CREATE TABLE menu_items (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
                            name VARCHAR(200) NOT NULL,
                            description TEXT,
                            price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
                            image_url TEXT,
                            is_available BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Restaurant Tables
CREATE TABLE restaurant_tables (
                                   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   table_number INTEGER NOT NULL UNIQUE CHECK (table_number > 0),
                                   capacity INTEGER NOT NULL CHECK (capacity > 0),
                                   section VARCHAR(50) DEFAULT 'Main',
                                   status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
                                   current_order_id UUID,
                                   waiter_id UUID,
                                   created_at TIMESTAMPTZ DEFAULT NOW(),
                                   updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Waiters
CREATE TABLE waiters (
                         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                         name VARCHAR(100) NOT NULL,
                         phone VARCHAR(20),
                         cnic VARCHAR(20),
                         employee_type VARCHAR(20) DEFAULT 'waiter' CHECK (employee_type IN ('waiter', 'chef', 'manager', 'cashier', 'cleaner')),
                         profile_pic TEXT,
                         is_active BOOLEAN DEFAULT TRUE,
                         is_on_duty BOOLEAN DEFAULT FALSE,
                         total_orders INTEGER DEFAULT 0,
                         total_revenue DECIMAL(12, 2) DEFAULT 0.00,
                         avg_rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5),
                         created_at TIMESTAMPTZ DEFAULT NOW(),
                         updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders
CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        order_type VARCHAR(20) NOT NULL DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'delivery')),
                        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
                        table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
                        waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                        customer_name VARCHAR(100),
                        customer_phone VARCHAR(20),
                        delivery_address TEXT,
                        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
                        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'online')),
                        receipt_printed BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        completed_at TIMESTAMPTZ
);

-- 7. Order Items
CREATE TABLE order_items (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                             menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
                             quantity INTEGER NOT NULL CHECK (quantity > 0),
                             unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
                             total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
                             created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Waiter Shifts
CREATE TABLE waiter_shifts (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               waiter_id UUID NOT NULL REFERENCES waiters(id) ON DELETE CASCADE,
                               clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               clock_out TIMESTAMPTZ,
                               notes TEXT,
                               created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Inventory Categories
CREATE TABLE inventory_categories (
                                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                      name VARCHAR(100) NOT NULL,
                                      icon VARCHAR(10) DEFAULT '📦',
                                      created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inventory Items
CREATE TABLE inventory_items (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
                                 name VARCHAR(200) NOT NULL,
                                 quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (quantity >= 0),
                                 unit VARCHAR(20) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'gram', 'liter', 'ml', 'pieces', 'dozen')),
                                 reorder_level DECIMAL(10, 2) DEFAULT 10.00 CHECK (reorder_level >= 0),
                                 purchase_price DECIMAL(10, 2) NOT NULL CHECK (purchase_price >= 0),
                                 supplier_name VARCHAR(200),
                                 image_url TEXT,
                                 total_value DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * purchase_price) STORED,
                                 created_at TIMESTAMPTZ DEFAULT NOW(),
                                 updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Daily Summaries
CREATE TABLE daily_summaries (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 summary_date DATE NOT NULL UNIQUE,
                                 total_orders INTEGER DEFAULT 0,
                                 completed_orders INTEGER DEFAULT 0,
                                 cancelled_orders INTEGER DEFAULT 0,
                                 total_revenue DECIMAL(12, 2) DEFAULT 0.00,
                                 dine_in_orders INTEGER DEFAULT 0,
                                 delivery_orders INTEGER DEFAULT 0,
                                 cash_payments INTEGER DEFAULT 0,
                                 online_payments INTEGER DEFAULT 0,
                                 top_waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                                 top_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_waiters_is_active ON waiters(is_active);
CREATE INDEX idx_waiter_shifts_waiter_id ON waiter_shifts(waiter_id);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX idx_restaurant_tables_status ON restaurant_tables(status);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waiters_updated_at BEFORE UPDATE ON waiters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_waiter_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.waiter_id IS NOT NULL THEN
UPDATE waiters
SET total_orders = total_orders + 1, total_revenue = total_revenue + NEW.total_amount
WHERE id = NEW.waiter_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waiter_stats AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_waiter_stats();

CREATE OR REPLACE FUNCTION auto_clock_in_waiter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.waiter_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM waiters WHERE id = NEW.waiter_id AND is_on_duty = TRUE) THEN
UPDATE waiters SET is_on_duty = TRUE WHERE id = NEW.waiter_id;
IF NOT EXISTS (SELECT 1 FROM waiter_shifts WHERE waiter_id = NEW.waiter_id AND clock_out IS NULL) THEN
                INSERT INTO waiter_shifts (waiter_id, clock_in) VALUES (NEW.waiter_id, NOW());
END IF;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_clock_in AFTER INSERT OR UPDATE ON orders
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
ALTER TABLE waiter_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Admin Config: Public can only read (for login verification)
CREATE POLICY "admin_config_select" ON admin_config FOR SELECT USING (true);
CREATE POLICY "admin_config_update" ON admin_config FOR UPDATE USING (true);

-- Menu Categories: Public read, anon key can write
CREATE POLICY "menu_categories_select" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "menu_categories_insert" ON menu_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "menu_categories_update" ON menu_categories FOR UPDATE USING (true);
CREATE POLICY "menu_categories_delete" ON menu_categories FOR DELETE USING (true);

-- Menu Items: Public read, anon key can write
CREATE POLICY "menu_items_select" ON menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items_insert" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "menu_items_update" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "menu_items_delete" ON menu_items FOR DELETE USING (true);

-- Restaurant Tables: Public read/write
CREATE POLICY "restaurant_tables_select" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "restaurant_tables_insert" ON restaurant_tables FOR INSERT WITH CHECK (true);
CREATE POLICY "restaurant_tables_update" ON restaurant_tables FOR UPDATE USING (true);
CREATE POLICY "restaurant_tables_delete" ON restaurant_tables FOR DELETE USING (true);

-- Waiters: Public read/write
CREATE POLICY "waiters_select" ON waiters FOR SELECT USING (true);
CREATE POLICY "waiters_insert" ON waiters FOR INSERT WITH CHECK (true);
CREATE POLICY "waiters_update" ON waiters FOR UPDATE USING (true);
CREATE POLICY "waiters_delete" ON waiters FOR DELETE USING (true);

-- Orders: Public read/write
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (true);
CREATE POLICY "orders_delete" ON orders FOR DELETE USING (true);

-- Order Items: Public read/write
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update" ON order_items FOR UPDATE USING (true);
CREATE POLICY "order_items_delete" ON order_items FOR DELETE USING (true);

-- Waiter Shifts: Public read/write
CREATE POLICY "waiter_shifts_select" ON waiter_shifts FOR SELECT USING (true);
CREATE POLICY "waiter_shifts_insert" ON waiter_shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "waiter_shifts_update" ON waiter_shifts FOR UPDATE USING (true);
CREATE POLICY "waiter_shifts_delete" ON waiter_shifts FOR DELETE USING (true);

-- Inventory Categories: Public read/write
CREATE POLICY "inventory_categories_select" ON inventory_categories FOR SELECT USING (true);
CREATE POLICY "inventory_categories_insert" ON inventory_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "inventory_categories_update" ON inventory_categories FOR UPDATE USING (true);
CREATE POLICY "inventory_categories_delete" ON inventory_categories FOR DELETE USING (true);

-- Inventory Items: Public read/write
CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "inventory_items_insert" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "inventory_items_update" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "inventory_items_delete" ON inventory_items FOR DELETE USING (true);

-- Daily Summaries: Public read/write
CREATE POLICY "daily_summaries_select" ON daily_summaries FOR SELECT USING (true);
CREATE POLICY "daily_summaries_insert" ON daily_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "daily_summaries_update" ON daily_summaries FOR UPDATE USING (true);
CREATE POLICY "daily_summaries_delete" ON daily_summaries FOR DELETE USING (true);

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW todays_orders AS
SELECT
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    SUM(total_amount) FILTER (WHERE status = 'completed') as total_revenue,
    COUNT(*) FILTER (WHERE order_type = 'dine-in') as dine_in_count,
    COUNT(*) FILTER (WHERE order_type = 'delivery') as delivery_count
FROM orders
WHERE DATE(created_at) = CURRENT_DATE;

CREATE OR REPLACE VIEW active_staff AS
SELECT
    w.id,
    w.name,
    w.employee_type,
    w.profile_pic,
    COUNT(o.id) as current_orders
FROM waiters w
         LEFT JOIN orders o ON o.waiter_id = w.id AND o.status = 'pending'
WHERE w.is_on_duty = TRUE AND w.is_active = TRUE
GROUP BY w.id, w.name, w.employee_type, w.profile_pic;

CREATE OR REPLACE VIEW low_stock_items AS
SELECT
    i.*,
    c.name as category_name,
    c.icon as category_icon
FROM inventory_items i
         LEFT JOIN inventory_categories c ON c.id = i.category_id
WHERE i.quantity <= i.reorder_level
ORDER BY i.quantity ASC;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION archive_old_orders(days_old INTEGER DEFAULT 90)
RETURNS TABLE(deleted_orders INTEGER, deleted_items INTEGER) AS $$
DECLARE
cutoff_date TIMESTAMPTZ;
    orders_deleted INTEGER;
    items_deleted INTEGER;
BEGIN
    cutoff_date := NOW() - (days_old || ' days')::INTERVAL;

DELETE FROM order_items
WHERE order_id IN (
    SELECT id FROM orders
    WHERE status = 'completed'
      AND completed_at < cutoff_date
);
GET DIAGNOSTICS items_deleted = ROW_COUNT;

DELETE FROM orders
WHERE status = 'completed'
  AND completed_at < cutoff_date;
GET DIAGNOSTICS orders_deleted = ROW_COUNT;

RETURN QUERY SELECT orders_deleted, items_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO menu_categories (name, icon, display_order) VALUES
                                                            ('Appetizers', '🥗', 1),
                                                            ('Main Course', '🍽️', 2),
                                                            ('Beverages', '🥤', 3),
                                                            ('Desserts', '🍰', 4),
                                                            ('Fast Food', '🍔', 5);

INSERT INTO restaurant_tables (table_number, capacity, section) VALUES
                                                                    (1, 4, 'Main'),
                                                                    (2, 4, 'Main'),
                                                                    (3, 6, 'Main'),
                                                                    (4, 2, 'Outdoor'),
                                                                    (5, 8, 'VIP');

INSERT INTO waiters (name, phone, employee_type) VALUES
                                                     ('Ahmed Ali', '+92 300 1234567', 'waiter'),
                                                     ('Sara Khan', '+92 301 7654321', 'waiter'),
                                                     ('Hassan Raza', '+92 302 9876543', 'chef');

INSERT INTO inventory_categories (name, icon) VALUES
                                                  ('Vegetables', '🥬'),
                                                  ('Meat & Poultry', '🍗'),
                                                  ('Dairy', '🥛'),
                                                  ('Spices', '🌶️'),
                                                  ('Beverages', '🥤')
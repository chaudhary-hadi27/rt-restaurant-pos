-- ============================================
-- RT RESTAURANT MANAGEMENT SYSTEM
-- Complete Database Schema (Final Version)
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
                              CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default admin (password: admin123)
INSERT INTO admin_config (id, password_hash)
VALUES (1, '$2a$10$default_hash_here');

-- ============================================
-- 2. WAITERS / STAFF
-- ============================================
CREATE TABLE waiters (
                         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                         name VARCHAR(100) NOT NULL,
                         phone VARCHAR(20),
                         cnic VARCHAR(20),
                         employee_type VARCHAR(20) DEFAULT 'waiter' CHECK (employee_type IN ('waiter', 'chef', 'manager', 'cashier', 'cleaner')),
                         profile_pic TEXT,
                         total_orders INTEGER DEFAULT 0,
                         total_revenue DECIMAL(10,2) DEFAULT 0,
                         avg_rating DECIMAL(3,2) DEFAULT 0,
                         is_active BOOLEAN DEFAULT TRUE,
                         is_on_duty BOOLEAN DEFAULT FALSE,
                         created_at TIMESTAMPTZ DEFAULT NOW(),
                         updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waiters_active ON waiters(is_active);
CREATE INDEX idx_waiters_on_duty ON waiters(is_on_duty);

-- ============================================
-- 3. TABLES
-- ============================================
CREATE TABLE restaurant_tables (
                                   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   table_number INTEGER NOT NULL UNIQUE,
                                   capacity INTEGER NOT NULL,
                                   section VARCHAR(50) DEFAULT 'Main',
                                   status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
                                   waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                                   current_order_id UUID,
                                   created_at TIMESTAMPTZ DEFAULT NOW(),
                                   updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tables_status ON restaurant_tables(status);
CREATE INDEX idx_tables_waiter ON restaurant_tables(waiter_id);

-- ============================================
-- 4. MENU CATEGORIES
-- ============================================
CREATE TABLE menu_categories (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 name VARCHAR(100) NOT NULL,
                                 icon VARCHAR(10) DEFAULT '📋',
                                 display_order INTEGER DEFAULT 0,
                                 is_active BOOLEAN DEFAULT TRUE,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_categories_active ON menu_categories(is_active);

-- ============================================
-- 5. MENU ITEMS
-- ============================================
CREATE TABLE menu_items (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
                            name VARCHAR(150) NOT NULL,
                            description TEXT,
                            price DECIMAL(10,2) NOT NULL,
                            image_url TEXT,
                            is_available BOOLEAN DEFAULT TRUE,
                            preparation_time INTEGER DEFAULT 15,
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- ============================================
-- 6. ORDERS
-- ============================================
CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
                        waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
                        order_type VARCHAR(20) DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'delivery')),
                        payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'online')),
                        subtotal DECIMAL(10,2) NOT NULL,
                        tax DECIMAL(10,2) DEFAULT 0,
                        total_amount DECIMAL(10,2) NOT NULL,
                        delivery_charges DECIMAL(10,2) DEFAULT 0,
                        customer_name VARCHAR(100),
                        customer_phone VARCHAR(20),
                        delivery_address TEXT,
                        notes TEXT,
                        receipt_printed BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_created ON orders(created_at);

-- ============================================
-- 7. ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                             menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
                             quantity INTEGER NOT NULL DEFAULT 1,
                             unit_price DECIMAL(10,2) NOT NULL,
                             total_price DECIMAL(10,2) NOT NULL,
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
                                      is_active BOOLEAN DEFAULT TRUE,
                                      created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. INVENTORY ITEMS
-- ============================================
CREATE TABLE inventory_items (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
                                 name VARCHAR(150) NOT NULL,
                                 description TEXT,
                                 image_url TEXT,
                                 quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                                 unit VARCHAR(20) NOT NULL DEFAULT 'kg',
                                 reorder_level DECIMAL(10,2) DEFAULT 10,
                                 purchase_price DECIMAL(10,2) NOT NULL,
                                 supplier_name VARCHAR(150),
                                 storage_location VARCHAR(100),
                                 is_active BOOLEAN DEFAULT TRUE,
                                 created_at TIMESTAMPTZ DEFAULT NOW(),
                                 updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_active ON inventory_items(is_active);

-- ============================================
-- 10. WAITER SHIFTS (ATTENDANCE)
-- ============================================
CREATE TABLE waiter_shifts (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               waiter_id UUID REFERENCES waiters(id) ON DELETE CASCADE,
                               clock_in TIMESTAMPTZ NOT NULL,
                               clock_out TIMESTAMPTZ,
                               created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waiter_shifts_waiter ON waiter_shifts(waiter_id);
CREATE INDEX idx_waiter_shifts_clock_in ON waiter_shifts(clock_in);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_waiters_updated_at BEFORE UPDATE ON waiters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Increment waiter stats
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

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================

-- Enable RLS (uncomment if using Supabase auth)
-- ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE waiter_shifts ENABLE ROW LEVEL SECURITY;

-- Public read access (uncomment if needed)
-- CREATE POLICY "Public read access" ON menu_items FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON menu_categories FOR SELECT USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample Menu Categories
INSERT INTO menu_categories (name, icon, display_order) VALUES
                                                            ('Fast Food', '🍔', 1),
                                                            ('Main Course', '🍛', 2),
                                                            ('Beverages', '☕', 3),
                                                            ('Desserts', '🍰', 4);

-- Sample Menu Items
INSERT INTO menu_items (category_id, name, price, is_available)
SELECT
    (SELECT id FROM menu_categories WHERE name = 'Fast Food'),
    'Chicken Burger',
    450,
    TRUE;

INSERT INTO menu_items (category_id, name, price, is_available)
SELECT
    (SELECT id FROM menu_categories WHERE name = 'Beverages'),
    'Fresh Juice',
    200,
    TRUE;

-- Sample Tables
INSERT INTO restaurant_tables (table_number, capacity, section) VALUES
                                                                    (1, 4, 'Main'),
                                                                    (2, 4, 'Main'),
                                                                    (3, 6, 'VIP'),
                                                                    (4, 2, 'Outdoor');

-- Sample Waiter
INSERT INTO waiters (name, phone, employee_type, is_active) VALUES
    ('Ali Ahmed', '+92 300 1234567', 'waiter', TRUE);

-- Sample Inventory Categories
INSERT INTO inventory_categories (name, icon, display_order) VALUES
                                                                 ('Vegetables', '🥕', 1),
                                                                 ('Meat', '🍖', 2),
                                                                 ('Dairy', '🥛', 3);

-- ============================================
-- VIEWS (Optional - for reporting)
-- ============================================

-- View: Active Orders with Details
CREATE OR REPLACE VIEW active_orders_view AS
SELECT
    o.id,
    o.status,
    o.order_type,
    o.total_amount,
    o.created_at,
    t.table_number,
    w.name AS waiter_name,
    COUNT(oi.id) AS item_count
FROM orders o
         LEFT JOIN restaurant_tables t ON o.table_id = t.id
         LEFT JOIN waiters w ON o.waiter_id = w.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status IN ('pending', 'preparing')
GROUP BY o.id, t.table_number, w.name;

-- View: Low Stock Items
CREATE OR REPLACE VIEW low_stock_items AS
SELECT
    i.id,
    i.name,
    i.quantity,
    i.unit,
    i.reorder_level,
    ic.name AS category_name
FROM inventory_items i
         LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.quantity <= i.reorder_level
  AND i.is_active = TRUE
ORDER BY i.quantity ASC;

-- ============================================
-- CLEANUP & MAINTENANCE
-- ============================================

-- Function: Archive old completed orders (run monthly)
CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS INTEGER AS $$
DECLARE
archived_count INTEGER;
BEGIN
    -- Move orders older than 6 months to archive table
    -- (Create archive table first if needed)
    -- For now, just count them
SELECT COUNT(*) INTO archived_count
FROM orders
WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '6 months';

RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS (if using multiple database users)
-- ============================================

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO restaurant_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO restaurant_app;

-- ============================================
-- SCHEMA COMPLETE ✅
-- ============================================

-- Notes:
-- 1. Run this entire file in Supabase SQL Editor
-- 2. Update admin_config password_hash with real bcrypt hash
-- 3. Enable RLS if using Supabase authentication
-- 4. Add sample data as needed for testing
-- 5. Create indexes for performance optimization
-- 6. Set up scheduled backups in Supabase dashboa
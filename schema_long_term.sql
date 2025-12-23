-- ============================================
-- LONG-TERM DATA ARCHIVE SYSTEM
-- Stores historical data permanently
-- ============================================

-- 1. Archive Tables (Permanent Storage)
CREATE TABLE IF NOT EXISTS orders_archive (
                                              id UUID PRIMARY KEY,
                                              table_id UUID,
                                              waiter_id UUID,
                                              status VARCHAR(20),
    order_type VARCHAR(20),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    delivery_address TEXT,
    delivery_charges DECIMAL(10, 2),
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    payment_method VARCHAR(20),
    receipt_printed BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS order_items_archive (
                                                   id UUID PRIMARY KEY,
                                                   order_id UUID,
                                                   menu_item_id UUID,
                                                   menu_item_name VARCHAR(200),
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    notes TEXT,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ DEFAULT NOW()
    );

-- 2. Monthly Summary (永久保存)
CREATE TABLE IF NOT EXISTS monthly_summaries (
                                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_tax DECIMAL(12, 2) DEFAULT 0,
    net_profit DECIMAL(12, 2) DEFAULT 0,
    top_menu_item VARCHAR(200),
    top_waiter VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, month)
    );

-- 3. Auto-Archive Function (Runs monthly)
CREATE OR REPLACE FUNCTION archive_monthly_data()
RETURNS TABLE(archived_orders INTEGER, archived_items INTEGER) AS $$
DECLARE
v_archived_orders INTEGER;
    v_archived_items INTEGER;
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    -- Archive orders older than 30 days
    v_cutoff_date := NOW() - INTERVAL '30 days';

    -- Insert into archive
INSERT INTO orders_archive
SELECT
    id, table_id, waiter_id, status, order_type,
    customer_name, customer_phone, delivery_address, delivery_charges,
    subtotal, tax, total_amount, payment_method, receipt_printed,
    notes, created_at, updated_at, NOW()
FROM orders
WHERE status = 'completed'
  AND created_at < v_cutoff_date
    ON CONFLICT (id) DO NOTHING;

GET DIAGNOSTICS v_archived_orders = ROW_COUNT;

-- Archive order items
INSERT INTO order_items_archive
SELECT
    oi.id, oi.order_id, oi.menu_item_id, mi.name,
    oi.quantity, oi.unit_price, oi.total_price,
    oi.notes, oi.status, oi.created_at, NOW()
FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE oi.order_id IN (
    SELECT id FROM orders_archive
    WHERE archived_at >= NOW() - INTERVAL '1 hour'
    )
ON CONFLICT (id) DO NOTHING;

GET DIAGNOSTICS v_archived_items = ROW_COUNT;

-- Delete from active tables
DELETE FROM order_items
WHERE order_id IN (SELECT id FROM orders_archive);

DELETE FROM orders
WHERE id IN (SELECT id FROM orders_archive);

RETURN QUERY SELECT v_archived_orders, v_archived_items;
END;
$$ LANGUAGE plpgsql;

-- 4. Generate Monthly Summary
CREATE OR REPLACE FUNCTION generate_monthly_summary(p_year INTEGER, p_month INTEGER)
RETURNS VOID AS $$
DECLARE
v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month')::DATE;

INSERT INTO monthly_summaries (year, month, total_orders, total_revenue, total_tax, net_profit, top_menu_item, top_waiter)
SELECT
    p_year,
    p_month,
    COUNT(DISTINCT o.id),
    COALESCE(SUM(o.total_amount), 0),
    COALESCE(SUM(o.tax), 0),
    COALESCE(SUM(o.total_amount - o.tax), 0),
    (SELECT mi.name FROM order_items oi
                             JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.created_at >= v_start_date AND oi.created_at < v_end_date
     GROUP BY mi.name ORDER BY SUM(oi.quantity) DESC LIMIT 1),
        (SELECT w.name FROM orders o2
         JOIN waiters w ON o2.waiter_id = w.id
         WHERE o2.created_at >= v_start_date AND o2.created_at < v_end_date
         GROUP BY w.name ORDER BY COUNT(*) DESC LIMIT 1)
FROM orders o
WHERE o.created_at >= v_start_date
  AND o.created_at < v_end_date
  AND o.status = 'completed'
ON CONFLICT (year, month) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
                                 total_revenue = EXCLUDED.total_revenue,
                                 total_tax = EXCLUDED.total_tax,
                                 net_profit = EXCLUDED.net_profit,
                                 top_menu_item = EXCLUDED.top_menu_item,
                                 top_waiter = EXCLUDED.top_waiter;
END;
$$ LANGUAGE plpgsql;

-- 5. Scheduled Monthly Job (Run on 1st of each month)
-- Manual execution: SELECT archive_monthly_data();
-- Manual summary: SELECT generate_monthly_summary(2024, 12);

-- 6. Query Archive Data
CREATE VIEW archive_summary AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as orders,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order_value
FROM orders_archive
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 7. Indexes for fast archive queries
CREATE INDEX IF NOT EXISTS idx_orders_archive_created ON orders_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_archive_waiter ON orders_archive(waiter_id);
CREATE INDEX IF NOT EXISTS idx_order_items_archive_order ON order_items_archive(order_id);

COMMENT ON TABLE orders_archive IS 'Permanent storage for completed orders (never deleted)';
COMMENT ON TABLE monthly_summaries IS 'Pre-calculated monthly statistics for fast reporting';
COMMENT ON FUNCTION archive_monthly_data IS 'Run on 1st of month: SELECT archive_monthly_data();';
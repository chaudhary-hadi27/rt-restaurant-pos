-- RT Restaurant POS - Database Schema (No dummy data)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins with role-based permissions
CREATE TABLE admins (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        email TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
                        permissions JSONB DEFAULT '{"inventory": true, "waiters": true, "tables": true, "analytics": true}'::jsonb,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        is_active BOOLEAN DEFAULT true
);

-- Waiters with performance tracking
CREATE TABLE waiters (
                         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                         name TEXT NOT NULL,
                         profile_pic TEXT,
                         phone TEXT,
                         total_orders INTEGER DEFAULT 0,
                         total_revenue DECIMAL(10, 2) DEFAULT 0,
                         created_at TIMESTAMPTZ DEFAULT NOW(),
                         is_active BOOLEAN DEFAULT true
);

-- Restaurant tables
CREATE TABLE restaurant_tables (
                                   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   table_number INTEGER UNIQUE NOT NULL,
                                   capacity INTEGER NOT NULL,
                                   status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')) DEFAULT 'available',
                                   current_waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                                   created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items
CREATE TABLE inventory_items (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 name TEXT NOT NULL,
                                 quantity INTEGER NOT NULL DEFAULT 0,
                                 unit TEXT NOT NULL,
                                 price DECIMAL(10, 2) NOT NULL,
                                 reorder_level INTEGER DEFAULT 10,
                                 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        order_number TEXT UNIQUE NOT NULL,
                        table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
                        waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL,
                        total_amount DECIMAL(10, 2) NOT NULL,
                        status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'served', 'completed')) DEFAULT 'pending',
                        created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                             inventory_item_id UUID REFERENCES inventory_items(id),
                             quantity INTEGER NOT NULL,
                             unit_price DECIMAL(10, 2) NOT NULL,
                             created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
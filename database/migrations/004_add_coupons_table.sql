-- Migration: 004_add_coupons_table.sql
-- Description: Add coupons table for discount codes
-- Date: 2026-02-14

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
    value DECIMAL(10, 2) NOT NULL CHECK (value >= 0),
    min_order_value DECIMAL(10, 2) CHECK (min_order_value >= 0),
    max_discount DECIMAL(10, 2) CHECK (max_discount >= 0),
    usage_limit INTEGER CHECK (usage_limit > 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (valid_until > valid_from)
);

-- Create indexes for performance
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupons_type ON coupons(type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

-- Add comments
COMMENT ON TABLE coupons IS 'Discount coupons for promotional campaigns';
COMMENT ON COLUMN coupons.code IS 'Unique coupon code (e.g., SAVE20, FREESHIP)';
COMMENT ON COLUMN coupons.type IS 'Coupon type: percentage, fixed, or free_shipping';
COMMENT ON COLUMN coupons.value IS 'Discount value (percentage or fixed amount)';
COMMENT ON COLUMN coupons.min_order_value IS 'Minimum order value required to use coupon';
COMMENT ON COLUMN coupons.max_discount IS 'Maximum discount amount (for percentage coupons)';
COMMENT ON COLUMN coupons.usage_limit IS 'Maximum number of times coupon can be used';
COMMENT ON COLUMN coupons.used_count IS 'Number of times coupon has been used';

-- Add coupon_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create index on orders.coupon_code
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON coupons TO kara_admin;

-- Insert sample coupons for testing
INSERT INTO coupons (code, type, value, min_order_value, valid_from, valid_until, usage_limit)
VALUES 
    ('WELCOME10', 'percentage', 10, 499, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 100),
    ('SAVE500', 'fixed', 500, 2499, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 50),
    ('FREESHIP', 'free_shipping', 0, 999, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', NULL);

-- Verify table created
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'coupons'
ORDER BY ordinal_position;

-- Insert migration record
INSERT INTO schema_migrations (version, description)
VALUES ('004', 'Add coupons table for discount codes');

PRINT 'Migration 004: Coupons table created successfully';

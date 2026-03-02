-- Migration: 004_add_coupons_table.sql
-- Description: Standardize coupons table to support type/value/validity-window coupon model

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

-- Backfill / align legacy coupons schema columns when present
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS type VARCHAR(20);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS value DECIMAL(10, 2);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE coupons
SET type = discount_type
WHERE type IS NULL AND discount_type IS NOT NULL;

UPDATE coupons
SET value = discount_value
WHERE value IS NULL AND discount_value IS NOT NULL;

UPDATE coupons
SET valid_from = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE valid_from IS NULL;

UPDATE coupons
SET valid_until = COALESCE(expiry_date::timestamp, CURRENT_TIMESTAMP + INTERVAL '90 days')
WHERE valid_until IS NULL;

ALTER TABLE coupons ALTER COLUMN type SET NOT NULL;
ALTER TABLE coupons ALTER COLUMN value SET NOT NULL;
ALTER TABLE coupons ALTER COLUMN valid_from SET NOT NULL;
ALTER TABLE coupons ALTER COLUMN valid_until SET NOT NULL;

-- Keep orders coupon reference in sync
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(type);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coupons_updated_at ON coupons;
CREATE TRIGGER trigger_update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

COMMENT ON TABLE coupons IS 'Discount coupons for promotional campaigns';

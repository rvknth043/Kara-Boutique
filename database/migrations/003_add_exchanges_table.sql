-- Migration: 003_add_exchanges_table.sql
-- Description: Add exchanges table for 7-day exchange policy
-- Date: 2026-02-14

-- Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('size_issue', 'color_difference', 'defective', 'wrong_item', 'other')),
    reason_details TEXT NOT NULL,
    exchange_variant_id UUID REFERENCES product_variants(id),
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'picked_up', 'completed', 'cancelled')),
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_exchanges_order_id ON exchanges(order_id);
CREATE INDEX idx_exchanges_user_id ON exchanges(user_id);
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_exchanges_created_at ON exchanges(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_exchanges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exchanges_updated_at
    BEFORE UPDATE ON exchanges
    FOR EACH ROW
    EXECUTE FUNCTION update_exchanges_updated_at();

-- Add constraint: Only one active exchange per order
CREATE UNIQUE INDEX idx_exchanges_unique_active_order
    ON exchanges (order_id)
    WHERE status NOT IN ('rejected', 'cancelled', 'completed');

-- Add comments
COMMENT ON TABLE exchanges IS '7-day exchange policy: Customer can exchange products within 7 days of delivery';
COMMENT ON COLUMN exchanges.reason IS 'Reason for exchange: size_issue, color_difference, defective, wrong_item, other';
COMMENT ON COLUMN exchanges.status IS 'Exchange status: requested, approved, rejected, picked_up, completed, cancelled';
COMMENT ON COLUMN exchanges.exchange_variant_id IS 'Optional: ID of the variant customer wants to exchange to';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON exchanges TO kara_admin;
GRANT USAGE, SELECT ON SEQUENCE exchanges_id_seq TO kara_admin;

-- Insert sample data for testing (optional)
-- INSERT INTO exchanges (order_id, user_id, reason, reason_details, status)
-- VALUES (
--     (SELECT id FROM orders LIMIT 1),
--     (SELECT user_id FROM orders LIMIT 1),
--     'size_issue',
--     'The size M is too small. I would like to exchange for size L.',
--     'requested'
-- );

-- Verify table created
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'exchanges'
ORDER BY ordinal_position;

PRINT 'Migration 003: Exchanges table created successfully';

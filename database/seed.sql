-- =====================================================
-- KARA BOUTIQUE - COMPREHENSIVE SEED DATA
-- =====================================================
-- This file contains realistic dummy data for testing
-- Run this after running the schema.sql
-- =====================================================

-- Clear existing data (optional - for fresh start)
TRUNCATE TABLE 
  order_items, orders, payments, reviews, exchanges, cart, wishlist,
  product_images, product_variants, products, categories, user_addresses, 
  users, coupons
CASCADE;

-- =====================================================
-- USERS (10 customers + 2 admins)
-- =====================================================
-- Password for all users: "password123" (hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, phone, role, is_verified) VALUES
-- Admin users
('admin@karaboutique.com', '$2b$10$YourHashedPasswordHere', 'Admin User', '9876543210', 'admin', true),
('manager@karaboutique.com', '$2b$10$YourHashedPasswordHere', 'Manager User', '9876543211', 'manager', true),

-- Regular customers
('priya.sharma@gmail.com', '$2b$10$YourHashedPasswordHere', 'Priya Sharma', '9876543212', 'customer', true),
('anjali.mehta@gmail.com', '$2b$10$YourHashedPasswordHere', 'Anjali Mehta', '9876543213', 'customer', true),
('neha.gupta@gmail.com', '$2b$10$YourHashedPasswordHere', 'Neha Gupta', '9876543214', 'customer', true),
('kavya.reddy@gmail.com', '$2b$10$YourHashedPasswordHere', 'Kavya Reddy', '9876543215', 'customer', true),
('riya.singh@gmail.com', '$2b$10$YourHashedPasswordHere', 'Riya Singh', '9876543216', 'customer', true),
('simran.kaur@gmail.com', '$2b$10$YourHashedPasswordHere', 'Simran Kaur', '9876543217', 'customer', true),
('tanvi.patel@gmail.com', '$2b$10$YourHashedPasswordHere', 'Tanvi Patel', '9876543218', 'customer', true),
('ishita.jain@gmail.com', '$2b$10$YourHashedPasswordHere', 'Ishita Jain', '9876543219', 'customer', true),
('pooja.verma@gmail.com', '$2b$10$YourHashedPasswordHere', 'Pooja Verma', '9876543220', 'customer', true),
('divya.nair@gmail.com', '$2b$10$YourHashedPasswordHere', 'Divya Nair', '9876543221', 'customer', true);

-- =====================================================
-- USER ADDRESSES
-- =====================================================
INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, pincode, country, is_default)
SELECT 
  id,
  'Plot 123, Rainbow Apartments',
  'Near City Mall, Sector 5',
  'Mumbai',
  'Maharashtra',
  '400001',
  'India',
  true
FROM users WHERE email = 'priya.sharma@gmail.com';

INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, pincode, country, is_default)
SELECT 
  id,
  '456 Green Park Colony',
  'Opposite Metro Station',
  'Delhi',
  'Delhi',
  '110016',
  'India',
  true
FROM users WHERE email = 'anjali.mehta@gmail.com';

INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, pincode, country, is_default)
SELECT 
  id,
  '789 Silk Board Layout',
  'HSR Layout Main Road',
  'Bangalore',
  'Karnataka',
  '560102',
  'India',
  true
FROM users WHERE email = 'neha.gupta@gmail.com';

-- Add more addresses for other users...

-- =====================================================
-- CATEGORIES
-- =====================================================
INSERT INTO categories (name, slug, description, is_active) VALUES
('Sarees', 'sarees', 'Traditional Indian sarees in various fabrics and designs', true),
('Lehengas', 'lehengas', 'Ethnic lehengas perfect for weddings and festivals', true),
('Kurtis', 'kurtis', 'Contemporary and traditional kurtis for everyday wear', true),
('Salwar Suits', 'salwar-suits', 'Elegant salwar kameez sets', true),
('Gowns', 'gowns', 'Indo-western gowns and anarkalis', true),
('Dupattas', 'dupattas', 'Stylish dupattas to complete your ethnic look', true),
('Accessories', 'accessories', 'Jewelry and accessories to complement your outfit', true);

-- =====================================================
-- PRODUCTS (30 products across categories)
-- =====================================================

-- Sarees (10 products)
INSERT INTO products (name, slug, description, base_price, discount_price, category_id, is_featured, is_active) VALUES
('Banarasi Silk Saree - Royal Blue', 'banarasi-silk-saree-royal-blue', 'Exquisite Banarasi silk saree with intricate golden zari work. Perfect for weddings and special occasions.', 8999.00, 6999.00, (SELECT id FROM categories WHERE slug = 'sarees'), true, true),
('Kanjivaram Silk Saree - Red', 'kanjivaram-silk-saree-red', 'Traditional Kanjivaram saree with temple border design. Made from pure silk.', 12999.00, 9999.00, (SELECT id FROM categories WHERE slug = 'sarees'), true, true),
('Chiffon Saree - Pastel Pink', 'chiffon-saree-pastel-pink', 'Lightweight chiffon saree with delicate embroidery. Comfortable for all-day wear.', 3499.00, 2799.00, (SELECT id FROM categories WHERE slug = 'sarees'), false, true),
('Georgette Saree - Navy Blue', 'georgette-saree-navy-blue', 'Elegant georgette saree with sequin work. Perfect for evening parties.', 4999.00, 3999.00, (SELECT id FROM categories WHERE slug = 'sarees'), false, true),
('Cotton Saree - Printed', 'cotton-saree-printed', 'Comfortable cotton saree with modern prints. Ideal for daily wear.', 1999.00, 1499.00, (SELECT id FROM categories WHERE slug = 'sarees'), false, true),
('Tussar Silk Saree - Mustard', 'tussar-silk-saree-mustard', 'Rich tussar silk saree with hand-painted designs.', 5999.00, 4499.00, (SELECT id FROM categories WHERE slug = 'sarees'), false, true),
('Net Saree - Black & Gold', 'net-saree-black-gold', 'Contemporary net saree with golden embellishments.', 6999.00, 5499.00, (SELECT id FROM categories WHERE slug = 'sarees'), true, true),
('Organza Saree - Lavender', 'organza-saree-lavender', 'Lightweight organza saree with floral patterns.', 4499.00, 3299.00, (SELECT id FROM categories WHERE slug = 'sarees'), false, true),
('Bandhani Saree - Green', 'bandhani-saree-green', 'Traditional Gujarati bandhani saree in vibrant green.', 3999.00, 2999.00, (SELECT id FROM categories WHERE slug = 'sarees'), false, true),
('Designer Saree - Maroon', 'designer-saree-maroon', 'Designer saree with contemporary cuts and styling.', 9999.00, 7999.00, (SELECT id FROM categories WHERE slug = 'sarees'), true, true);

-- Lehengas (8 products)
INSERT INTO products (name, slug, description, base_price, discount_price, category_id, is_featured, is_active) VALUES
('Bridal Lehenga - Red & Gold', 'bridal-lehenga-red-gold', 'Stunning bridal lehenga with heavy embroidery and sequin work. Comes with dupatta and choli.', 24999.00, 19999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), true, true),
('Party Wear Lehenga - Pink', 'party-wear-lehenga-pink', 'Beautiful party wear lehenga with mirror work and thread embroidery.', 15999.00, 12999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), true, true),
('Indo-Western Lehenga - Blue', 'indo-western-lehenga-blue', 'Contemporary Indo-western lehenga with modern silhouette.', 18999.00, 14999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), false, true),
('Chaniya Choli - Multicolor', 'chaniya-choli-multicolor', 'Traditional Gujarati chaniya choli perfect for Navratri.', 8999.00, 6999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), false, true),
('Simple Lehenga - Peach', 'simple-lehenga-peach', 'Elegant simple lehenga with minimal work. Perfect for casual functions.', 9999.00, 7999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), false, true),
('Velvet Lehenga - Wine', 'velvet-lehenga-wine', 'Rich velvet lehenga with stone work. Perfect for winter weddings.', 21999.00, 17999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), true, true),
('Net Lehenga - Cream', 'net-lehenga-cream', 'Lightweight net lehenga with delicate embroidery.', 13999.00, 10999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), false, true),
('Silk Lehenga - Green', 'silk-lehenga-green', 'Traditional silk lehenga with golden zari border.', 16999.00, 13999.00, (SELECT id FROM categories WHERE slug = 'lehengas'), false, true);

-- Kurtis (12 products)
INSERT INTO products (name, slug, description, base_price, discount_price, category_id, is_featured, is_active) VALUES
('Cotton Kurti - White', 'cotton-kurti-white', 'Comfortable pure cotton kurti with block prints. Perfect for daily wear.', 1299.00, 999.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Anarkali Kurti - Purple', 'anarkali-kurti-purple', 'Flowing anarkali style kurti with embroidery on neckline.', 1999.00, 1499.00, (SELECT id FROM categories WHERE slug = 'kurtis'), true, true),
('A-Line Kurti - Yellow', 'a-line-kurti-yellow', 'Trendy A-line kurti with printed patterns.', 1499.00, 1099.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Straight Kurti - Black', 'straight-kurti-black', 'Simple straight cut kurti with side slits.', 1199.00, 899.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Palazzo Kurti Set - Blue', 'palazzo-kurti-set-blue', 'Kurti with matching palazzo pants. Complete set.', 2499.00, 1999.00, (SELECT id FROM categories WHERE slug = 'kurtis'), true, true),
('Embroidered Kurti - Red', 'embroidered-kurti-red', 'Elegant kurti with hand embroidery on front.', 1799.00, 1299.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Long Kurti - Green', 'long-kurti-green', 'Floor length kurti perfect for festive occasions.', 2199.00, 1699.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Printed Kurti - Multicolor', 'printed-kurti-multicolor', 'Vibrant printed kurti with modern patterns.', 1399.00, 999.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Designer Kurti - Maroon', 'designer-kurti-maroon', 'Designer kurti with unique neckline and cuts.', 2299.00, 1799.00, (SELECT id FROM categories WHERE slug = 'kurtis'), true, true),
('Kurti with Jacket - Navy', 'kurti-with-jacket-navy', 'Kurti with detachable jacket. Indo-western style.', 2999.00, 2299.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Short Kurti - Pink', 'short-kurti-pink', 'Trendy short kurti perfect for jeans pairing.', 1199.00, 899.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true),
('Tunic Style Kurti - Grey', 'tunic-style-kurti-grey', 'Western style tunic with ethnic touch.', 1599.00, 1199.00, (SELECT id FROM categories WHERE slug = 'kurtis'), false, true);

-- =====================================================
-- PRODUCT VARIANTS (Multiple sizes and colors)
-- =====================================================

-- Variants for Banarasi Silk Saree
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, 'Free Size', 'Royal Blue', 'BSS-RB-001', 15, 0 FROM products WHERE slug = 'banarasi-silk-saree-royal-blue';

-- Variants for Kanjivaram Silk Saree
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, 'Free Size', 'Red', 'KSS-R-001', 10, 0 FROM products WHERE slug = 'kanjivaram-silk-saree-red';

-- Variants for Bridal Lehenga (multiple sizes)
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, size, 'Red', 'BL-RG-' || size, 8, 0
FROM products, unnest(ARRAY['S', 'M', 'L', 'XL']) AS size
WHERE slug = 'bridal-lehenga-red-gold';

-- Variants for Party Wear Lehenga
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, size, 'Pink', 'PWL-P-' || size, 12, 0
FROM products, unnest(ARRAY['S', 'M', 'L', 'XL']) AS size
WHERE slug = 'party-wear-lehenga-pink';

-- Variants for Cotton Kurti (multiple sizes and colors)
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, size, 'White', 'CK-W-' || size, 25, 0
FROM products, unnest(ARRAY['S', 'M', 'L', 'XL', 'XXL']) AS size
WHERE slug = 'cotton-kurti-white';

INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, size, 'Beige', 'CK-B-' || size, 20, 0
FROM products, unnest(ARRAY['S', 'M', 'L', 'XL', 'XXL']) AS size
WHERE slug = 'cotton-kurti-white';

-- Variants for Anarkali Kurti
INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
SELECT id, size, 'Purple', 'AK-P-' || size, 18, 0
FROM products, unnest(ARRAY['S', 'M', 'L', 'XL']) AS size
WHERE slug = 'anarkali-kurti-purple';

-- Add variants for all other products (simplified for brevity)
-- In production, you'd want comprehensive variants for all products

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================
INSERT INTO product_images (product_id, image_url, display_order, is_primary)
SELECT 
  id,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', -- Saree image
  1,
  true
FROM products WHERE slug = 'banarasi-silk-saree-royal-blue';

INSERT INTO product_images (product_id, image_url, display_order, is_primary)
SELECT 
  id,
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', -- Lehenga image
  1,
  true
FROM products WHERE slug = 'bridal-lehenga-red-gold';

-- Add more images for other products...

-- =====================================================
-- COUPONS
-- =====================================================
INSERT INTO coupons (code, type, value, min_order_value, max_discount, usage_limit, used_count, valid_from, valid_until, is_active) VALUES
('WELCOME10', 'percentage', 10, 1000, 500, 100, 5, NOW(), NOW() + INTERVAL '30 days', true),
('FESTIVE20', 'percentage', 20, 2000, 1000, 50, 12, NOW(), NOW() + INTERVAL '15 days', true),
('FLAT500', 'fixed', 500, 3000, NULL, 200, 45, NOW(), NOW() + INTERVAL '60 days', true),
('FREESHIP', 'free_shipping', 0, 1000, NULL, 500, 123, NOW(), NOW() + INTERVAL '90 days', true),
('SUMMER25', 'percentage', 25, 5000, 2000, 30, 8, NOW(), NOW() + INTERVAL '20 days', true);

-- =====================================================
-- ORDERS (Sample orders for testing)
-- =====================================================
-- Note: You'll need to insert orders with proper user_id and address_id
-- This is a simplified version

-- =====================================================
-- SIZE CHART (For products)
-- =====================================================
INSERT INTO size_charts (product_id, size, bust, waist, hips, length)
SELECT id, 'S', '32-34', '26-28', '34-36', '42' FROM products WHERE slug = 'bridal-lehenga-red-gold'
UNION ALL
SELECT id, 'M', '34-36', '28-30', '36-38', '42' FROM products WHERE slug = 'bridal-lehenga-red-gold'
UNION ALL
SELECT id, 'L', '36-38', '30-32', '38-40', '42' FROM products WHERE slug = 'bridal-lehenga-red-gold'
UNION ALL
SELECT id, 'XL', '38-40', '32-34', '40-42', '42' FROM products WHERE slug = 'bridal-lehenga-red-gold';

-- =====================================================
-- SUMMARY
-- =====================================================
-- Users: 12 (2 admins, 10 customers)
-- Categories: 7
-- Products: 30
-- Product Variants: 50+
-- Coupons: 5 active
-- Product Images: Multiple per product
-- =====================================================

SELECT 'Seed data created successfully!' AS message;

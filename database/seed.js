const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kara_boutique',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const SALT_ROUNDS = 10;

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await client.query(`
      TRUNCATE TABLE 
        order_items, orders, payments, reviews, exchanges, cart, wishlist,
        product_images, product_variants, size_charts, products, categories, 
        user_addresses, users, coupons
      CASCADE
    `);
    console.log('✓ Existing data cleared\n');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
    console.log('🔐 Password hashed: password123\n');

    // =====================================================
    // USERS
    // =====================================================
    console.log('👥 Creating users...');
    const usersResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role, is_verified) VALUES
      ('admin@karaboutique.com', $1, 'Admin User', '9876543210', 'admin', true),
      ('manager@karaboutique.com', $1, 'Manager User', '9876543211', 'manager', true),
      ('priya.sharma@gmail.com', $1, 'Priya Sharma', '9876543212', 'customer', true),
      ('anjali.mehta@gmail.com', $1, 'Anjali Mehta', '9876543213', 'customer', true),
      ('neha.gupta@gmail.com', $1, 'Neha Gupta', '9876543214', 'customer', true),
      ('kavya.reddy@gmail.com', $1, 'Kavya Reddy', '9876543215', 'customer', true),
      ('riya.singh@gmail.com', $1, 'Riya Singh', '9876543216', 'customer', true),
      ('simran.kaur@gmail.com', $1, 'Simran Kaur', '9876543217', 'customer', true),
      ('tanvi.patel@gmail.com', $1, 'Tanvi Patel', '9876543218', 'customer', true),
      ('divya.nair@gmail.com', $1, 'Divya Nair', '9876543219', 'customer', true)
      RETURNING id, email, role
    `, [hashedPassword]);
    console.log(`✓ Created ${usersResult.rows.length} users`);
    
    const users = usersResult.rows;
    const adminUser = users.find(u => u.role === 'admin');
    const customerUsers = users.filter(u => u.role === 'customer');

    // =====================================================
    // USER ADDRESSES
    // =====================================================
    console.log('📍 Creating addresses...');
    const addresses = [
      { user: customerUsers[0], line1: 'Plot 123, Rainbow Apartments', line2: 'Near City Mall', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      { user: customerUsers[1], line1: '456 Green Park Colony', line2: 'Opposite Metro', city: 'Delhi', state: 'Delhi', pincode: '110016' },
      { user: customerUsers[2], line1: '789 Silk Board Layout', line2: 'HSR Main Road', city: 'Bangalore', state: 'Karnataka', pincode: '560102' },
      { user: customerUsers[3], line1: '321 Beach Road', line2: 'Near Marina', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
      { user: customerUsers[4], line1: '654 Park Street', line2: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
    ];

    for (const addr of addresses) {
      await client.query(`
        INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, pincode, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, 'India', true)
      `, [addr.user.id, addr.line1, addr.line2, addr.city, addr.state, addr.pincode]);
    }
    console.log(`✓ Created ${addresses.length} addresses\n`);

    // =====================================================
    // CATEGORIES
    // =====================================================
    console.log('📂 Creating categories...');
    const categoriesResult = await client.query(`
      INSERT INTO categories (name, slug, description, is_active) VALUES
      ('Sarees', 'sarees', 'Traditional Indian sarees', true),
      ('Lehengas', 'lehengas', 'Ethnic lehengas for weddings', true),
      ('Kurtis', 'kurtis', 'Contemporary kurtis', true),
      ('Salwar Suits', 'salwar-suits', 'Elegant salwar sets', true),
      ('Gowns', 'gowns', 'Indo-western gowns', true),
      ('Dupattas', 'dupattas', 'Stylish dupattas', true),
      ('Accessories', 'accessories', 'Jewelry and accessories', true)
      RETURNING id, slug
    `);
    console.log(`✓ Created ${categoriesResult.rows.length} categories\n`);
    
    const categories = categoriesResult.rows;

    // =====================================================
    // PRODUCTS
    // =====================================================
    console.log('🛍️  Creating products...');
    
    const products = [
      // Sarees
      { name: 'Banarasi Silk Saree - Royal Blue', slug: 'banarasi-silk-saree-royal-blue', desc: 'Exquisite Banarasi silk saree with golden zari work', price: 8999, discount: 6999, category: 'sarees', featured: true },
      { name: 'Kanjivaram Silk Saree - Red', slug: 'kanjivaram-silk-saree-red', desc: 'Traditional Kanjivaram saree with temple border', price: 12999, discount: 9999, category: 'sarees', featured: true },
      { name: 'Chiffon Saree - Pastel Pink', slug: 'chiffon-saree-pastel-pink', desc: 'Lightweight chiffon saree with embroidery', price: 3499, discount: 2799, category: 'sarees', featured: false },
      { name: 'Georgette Saree - Navy Blue', slug: 'georgette-saree-navy-blue', desc: 'Elegant georgette saree with sequin work', price: 4999, discount: 3999, category: 'sarees', featured: false },
      { name: 'Designer Saree - Maroon', slug: 'designer-saree-maroon', desc: 'Designer saree with contemporary styling', price: 9999, discount: 7999, category: 'sarees', featured: true },
      
      // Lehengas
      { name: 'Bridal Lehenga - Red Gold', slug: 'bridal-lehenga-red-gold', desc: 'Stunning bridal lehenga with heavy embroidery', price: 24999, discount: 19999, category: 'lehengas', featured: true },
      { name: 'Party Wear Lehenga - Pink', slug: 'party-wear-lehenga-pink', desc: 'Beautiful party wear lehenga with mirror work', price: 15999, discount: 12999, category: 'lehengas', featured: true },
      { name: 'Velvet Lehenga - Wine', slug: 'velvet-lehenga-wine', desc: 'Rich velvet lehenga with stone work', price: 21999, discount: 17999, category: 'lehengas', featured: true },
      { name: 'Indo Western Lehenga - Blue', slug: 'indo-western-lehenga-blue', desc: 'Contemporary Indo-western lehenga', price: 18999, discount: 14999, category: 'lehengas', featured: false },
      
      // Kurtis
      { name: 'Cotton Kurti - White', slug: 'cotton-kurti-white', desc: 'Comfortable pure cotton kurti with block prints', price: 1299, discount: 999, category: 'kurtis', featured: false },
      { name: 'Anarkali Kurti - Purple', slug: 'anarkali-kurti-purple', desc: 'Flowing anarkali style kurti with embroidery', price: 1999, discount: 1499, category: 'kurtis', featured: true },
      { name: 'Designer Kurti - Maroon', slug: 'designer-kurti-maroon', desc: 'Designer kurti with unique neckline', price: 2299, discount: 1799, category: 'kurtis', featured: true },
      { name: 'Palazzo Kurti Set - Blue', slug: 'palazzo-kurti-set-blue', desc: 'Kurti with matching palazzo pants', price: 2499, discount: 1999, category: 'kurtis', featured: true },
      { name: 'Printed Kurti - Multicolor', slug: 'printed-kurti-multicolor', desc: 'Vibrant printed kurti', price: 1399, discount: 999, category: 'kurtis', featured: false },
      { name: 'Long Kurti - Green', slug: 'long-kurti-green', desc: 'Floor length kurti for festive occasions', price: 2199, discount: 1699, category: 'kurtis', featured: false },
    ];

    const createdProducts = [];
    for (const prod of products) {
      const categoryId = categories.find(c => c.slug === prod.category).id;
      const result = await client.query(`
        INSERT INTO products (name, slug, description, base_price, discount_price, category_id, is_featured, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING id, slug, name
      `, [prod.name, prod.slug, prod.desc, prod.price, prod.discount, categoryId, prod.featured]);
      createdProducts.push(result.rows[0]);
    }
    console.log(`✓ Created ${createdProducts.length} products\n`);

    // =====================================================
    // PRODUCT VARIANTS
    // =====================================================
    console.log('📦 Creating product variants...');
    let variantCount = 0;

    for (const product of createdProducts) {
      // Sarees - Free Size
      if (product.slug.includes('saree')) {
        await client.query(`
          INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
          VALUES ($1, 'Free Size', 'Default', $2, 20, 0)
        `, [product.id, `${product.slug.substring(0, 10).toUpperCase()}-001`]);
        variantCount++;
      }
      
      // Lehengas - Multiple Sizes
      else if (product.slug.includes('lehenga')) {
        const sizes = ['S', 'M', 'L', 'XL'];
        for (const size of sizes) {
          await client.query(`
            INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
            VALUES ($1, $2, 'Default', $3, 15, 0)
          `, [product.id, size, `${product.slug.substring(0, 8).toUpperCase()}-${size}`]);
          variantCount++;
        }
      }
      
      // Kurtis - Multiple Sizes & Colors
      else if (product.slug.includes('kurti')) {
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        const colors = ['White', 'Black', 'Blue'];
        for (const size of sizes) {
          for (const color of colors.slice(0, 2)) { // 2 colors per size
            await client.query(`
              INSERT INTO product_variants (product_id, size, color, sku, stock_quantity, reserved_quantity)
              VALUES ($1, $2, $3, $4, 25, 0)
            `, [product.id, size, color, `${product.slug.substring(0, 6).toUpperCase()}-${size}-${color[0]}`]);
            variantCount++;
          }
        }
      }
    }
    console.log(`✓ Created ${variantCount} product variants\n`);

    // =====================================================
    // PRODUCT IMAGES
    // =====================================================
    console.log('🖼️  Creating product images...');
    const imageUrls = {
      saree: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e4421?w=800',
      ],
      lehenga: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        'https://images.unsplash.com/photo-1598524815498-e9adc4bb8b41?w=800',
      ],
      kurti: [
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
        'https://images.unsplash.com/photo-1610652456249-8ea400c5f9ab?w=800',
      ],
    };

    for (const product of createdProducts) {
      let urls = imageUrls.saree;
      if (product.slug.includes('lehenga')) urls = imageUrls.lehenga;
      else if (product.slug.includes('kurti')) urls = imageUrls.kurti;

      for (let i = 0; i < urls.length; i++) {
        await client.query(`
          INSERT INTO product_images (product_id, image_url, display_order, is_primary)
          VALUES ($1, $2, $3, $4)
        `, [product.id, urls[i], i + 1, i === 0]);
      }
    }
    console.log(`✓ Created product images\n`);

    // =====================================================
    // SIZE CHARTS
    // =====================================================
    console.log('📏 Creating size charts...');
    const lehengas = createdProducts.filter(p => p.slug.includes('lehenga'));
    for (const lehenga of lehengas) {
      const sizes = [
        { size: 'S', bust: '32-34', waist: '26-28', hips: '34-36', length: '42' },
        { size: 'M', bust: '34-36', waist: '28-30', hips: '36-38', length: '42' },
        { size: 'L', bust: '36-38', waist: '30-32', hips: '38-40', length: '42' },
        { size: 'XL', bust: '38-40', waist: '32-34', hips: '40-42', length: '42' },
      ];
      
      for (const s of sizes) {
        await client.query(`
          INSERT INTO size_charts (product_id, size, bust, waist, hips, length)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [lehenga.id, s.size, s.bust, s.waist, s.hips, s.length]);
      }
    }
    console.log(`✓ Created size charts\n`);

    // =====================================================
    // COUPONS
    // =====================================================
    console.log('🎫 Creating coupons...');
    await client.query(`
      INSERT INTO coupons (code, type, value, min_order_value, max_discount, usage_limit, used_count, valid_from, valid_until, is_active) VALUES
      ('WELCOME10', 'percentage', 10, 1000, 500, 100, 0, NOW(), NOW() + INTERVAL '30 days', true),
      ('FESTIVE20', 'percentage', 20, 2000, 1000, 50, 0, NOW(), NOW() + INTERVAL '15 days', true),
      ('FLAT500', 'fixed', 500, 3000, NULL, 200, 0, NOW(), NOW() + INTERVAL '60 days', true),
      ('FREESHIP', 'free_shipping', 0, 1000, NULL, 500, 0, NOW(), NOW() + INTERVAL '90 days', true),
      ('SUMMER25', 'percentage', 25, 5000, 2000, 30, 0, NOW(), NOW() + INTERVAL '20 days', true)
    `);
    console.log(`✓ Created 5 coupons\n`);

    // =====================================================
    // SAMPLE ORDERS FOR TESTING
    // =====================================================
    console.log('📦 Creating sample orders...');
    
    // Get first customer and their address
    const customer = customerUsers[0];
    const addressResult = await client.query(
      'SELECT id FROM user_addresses WHERE user_id = $1 LIMIT 1',
      [customer.id]
    );
    const addressId = addressResult.rows[0].id;

    // Get some product variants
    const variantsResult = await client.query('SELECT id FROM product_variants LIMIT 5');
    const variants = variantsResult.rows;

    // Create 3 sample orders
    const orderStatuses = ['delivered', 'shipped', 'processing'];
    for (let i = 0; i < 3; i++) {
      const orderNumber = `ORD-${Date.now()}-${i}`;
      const orderResult = await client.query(`
        INSERT INTO orders (
          user_id, order_number, total_amount, shipping_charge, 
          discount_amount, final_amount, payment_method, shipping_address_id,
          payment_status, order_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        customer.id, 
        orderNumber, 
        5000 + (i * 1000), 
        i === 0 ? 0 : 49, 
        i * 100, 
        5000 + (i * 1000) - (i * 100) + (i === 0 ? 0 : 49),
        i === 0 ? 'razorpay' : 'cod',
        addressId,
        'paid',
        orderStatuses[i]
      ]);

      const orderId = orderResult.rows[0].id;

      // Add order items
      const variant = variants[i];
      await client.query(`
        INSERT INTO order_items (order_id, product_variant_id, quantity, price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [orderId, variant.id, 1 + i, 2000, 2000 * (1 + i)]);
    }
    console.log(`✓ Created 3 sample orders\n`);

    // =====================================================
    // SAMPLE REVIEWS
    // =====================================================
    console.log('⭐ Creating sample reviews...');
    const reviewTexts = [
      'Excellent product! Beautiful color and amazing quality. Highly recommend!',
      'Very good purchase. The fabric is soft and comfortable. Worth the price.',
      'Loved it! Perfect for the occasion. Will buy again.',
      'Good product but delivery was delayed. Overall satisfied.',
      'Amazing quality! Exceeded my expectations. Great value for money.',
    ];

    for (let i = 0; i < 5; i++) {
      const product = createdProducts[i];
      const reviewer = customerUsers[i % customerUsers.length];
      
      await client.query(`
        INSERT INTO reviews (user_id, product_id, rating, review_text, is_verified_purchase)
        VALUES ($1, $2, $3, $4, true)
      `, [reviewer.id, product.id, 4 + (i % 2), reviewTexts[i]]);
    }
    console.log(`✓ Created 5 sample reviews\n`);

    await client.query('COMMIT');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
    
    // Print summary
    console.log('📊 SEED DATA SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log('Users:            12 (2 admin, 10 customers)');
    console.log('Categories:       7');
    console.log('Products:         15');
    console.log(`Variants:         ${variantCount}`);
    console.log('Coupons:          5');
    console.log('Orders:           3');
    console.log('Reviews:          5');
    console.log('Addresses:        5');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔑 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('Admin:');
    console.log('  Email:    admin@karaboutique.com');
    console.log('  Password: password123');
    console.log('');
    console.log('Customer:');
    console.log('  Email:    priya.sharma@gmail.com');
    console.log('  Password: password123');
    console.log('═══════════════════════════════════════\n');
    
    console.log('💳 ACTIVE COUPONS');
    console.log('═══════════════════════════════════════');
    console.log('WELCOME10  - 10% off (min order: ₹1000)');
    console.log('FESTIVE20  - 20% off (min order: ₹2000)');
    console.log('FLAT500    - ₹500 off (min order: ₹3000)');
    console.log('FREESHIP   - Free shipping (min order: ₹1000)');
    console.log('SUMMER25   - 25% off (min order: ₹5000)');
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed script
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

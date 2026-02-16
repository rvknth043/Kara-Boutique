const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kara_boutique',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const SALT_ROUNDS = 10;
const TARGET_USERS = Number(process.env.SEED_USER_COUNT || 100);
const TARGET_PRODUCTS = Number(process.env.SEED_PRODUCT_COUNT || 1200);

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Aanya', 'Ananya', 'Aadhya', 'Diya', 'Isha', 'Kavya', 'Meera', 'Riya', 'Tanvi', 'Pooja', 'Sneha', 'Neha', 'Priya'];
const LAST_NAMES = ['Sharma', 'Mehta', 'Gupta', 'Patel', 'Reddy', 'Singh', 'Nair', 'Jain', 'Kapoor', 'Verma', 'Agarwal', 'Bansal', 'Malhotra', 'Iyer', 'Menon', 'Das', 'Khan', 'Yadav', 'Mishra', 'Saxena'];

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
];

const CATEGORY_CONFIG = [
  { name: 'Sarees', slug: 'sarees', description: 'Traditional and modern saree collections', baseMin: 1800, baseMax: 18000 },
  { name: 'Lehengas', slug: 'lehengas', description: 'Bridal and festive lehengas', baseMin: 3500, baseMax: 28000 },
  { name: 'Kurtis', slug: 'kurtis', description: 'Daily wear and designer kurtis', baseMin: 900, baseMax: 5200 },
  { name: 'Salwar Suits', slug: 'salwar-suits', description: 'Elegant salwar suit sets', baseMin: 1500, baseMax: 9000 },
  { name: 'Gowns', slug: 'gowns', description: 'Ethnic and indo-western gowns', baseMin: 2500, baseMax: 14000 },
  { name: 'Dupattas', slug: 'dupattas', description: 'Designer and everyday dupattas', baseMin: 500, baseMax: 3800 },
  { name: 'Accessories', slug: 'accessories', description: 'Accessories for every outfit', baseMin: 300, baseMax: 4500 },
  { name: 'Co-ord Sets', slug: 'co-ord-sets', description: 'Matching festive and casual sets', baseMin: 1700, baseMax: 11000 },
];

const COLORS = ['Red', 'Blue', 'Green', 'Black', 'Pink', 'Maroon', 'Mustard', 'Purple', 'Teal', 'Ivory'];
const IMAGE_CATALOG = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900',
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900',
  'https://images.unsplash.com/photo-1617627143750-d86bc21e4421?w=900',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900',
  'https://images.unsplash.com/photo-1610652456249-8ea400c5f9ab?w=900',
  'https://images.unsplash.com/photo-1598524815498-e9adc4bb8b41?w=900',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getTableColumns(client, tableName) {
  const result = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function getExistingTables(client, tableNames) {
  if (!tableNames.length) return [];

  const result = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [tableNames]
  );

  return result.rows.map((row) => row.table_name);
}

async function bulkInsert(client, table, columns, rows, returning = '') {
  if (!rows.length) return [];

  const values = [];
  const placeholders = rows
    .map((row, rowIndex) => {
      const rowPlaceholders = columns.map((_, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`);
      values.push(...row);
      return `(${rowPlaceholders.join(', ')})`;
    })
    .join(', ');

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} ${returning ? `RETURNING ${returning}` : ''}`;
  const result = await client.query(sql, values);
  return result.rows;
}

async function seedCoupons(client) {
  const couponColumns = await getTableColumns(client, 'coupons');

  const now = new Date();
  const validUntil = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

  const coupons = [
    { code: 'WELCOME10', type: 'percentage', value: 10, min_order_value: 999, max_discount: 500, usage_limit: 1000, used_count: 0 },
    { code: 'FESTIVE20', type: 'percentage', value: 20, min_order_value: 1999, max_discount: 1500, usage_limit: 500, used_count: 0 },
    { code: 'FLAT500', type: 'fixed', value: 500, min_order_value: 2999, max_discount: null, usage_limit: 700, used_count: 0 },
    { code: 'MEGA1000', type: 'fixed', value: 1000, min_order_value: 6999, max_discount: null, usage_limit: 200, used_count: 0 },
    { code: 'FREESHIP', type: 'free_shipping', value: 0, min_order_value: 1499, max_discount: null, usage_limit: 2500, used_count: 0 },
  ];

  const strategies = [
    ['code', 'type', 'value', 'discount_type', 'discount_value', 'min_order_value', 'max_discount', 'usage_limit', 'used_count', 'valid_from', 'valid_until', 'expiry_date', 'is_active'],
    ['code', 'type', 'value', 'min_order_value', 'max_discount', 'usage_limit', 'used_count', 'valid_from', 'valid_until', 'is_active'],
    ['code', 'discount_type', 'discount_value', 'min_order_value', 'max_discount', 'usage_limit', 'used_count', 'expiry_date', 'is_active'],
    ['code', 'type', 'value', 'discount_type', 'discount_value', 'min_order_value', 'max_discount', 'usage_limit', 'used_count', 'is_active'],
  ];

  const mapCouponValue = (coupon, column) => {
    switch (column) {
      case 'code':
        return coupon.code;
      case 'type':
        return coupon.type;
      case 'discount_type':
        return coupon.type === 'free_shipping' ? 'fixed' : coupon.type;
      case 'value':
      case 'discount_value':
        return coupon.value;
      case 'min_order_value':
        return coupon.min_order_value;
      case 'max_discount':
        return coupon.max_discount;
      case 'usage_limit':
        return coupon.usage_limit;
      case 'used_count':
        return coupon.used_count;
      case 'valid_from':
        return now;
      case 'valid_until':
      case 'expiry_date':
        return validUntil;
      case 'is_active':
        return true;
      default:
        return null;
    }
  };

  let lastError;

  for (const strategy of strategies) {
    const availableColumns = strategy.filter((column) => couponColumns.has(column));

    // A valid strategy must satisfy at least one discount pair.
    const hasModernPair = availableColumns.includes('type') && availableColumns.includes('value');
    const hasLegacyPair = availableColumns.includes('discount_type') && availableColumns.includes('discount_value');
    if (!hasModernPair && !hasLegacyPair) continue;

    const rows = coupons
      .filter((coupon) => {
        // Legacy discount_type constraints typically do not allow free_shipping.
        if (hasLegacyPair && !hasModernPair && coupon.type === 'free_shipping') return false;
        return true;
      })
      .map((coupon) => availableColumns.map((column) => mapCouponValue(coupon, column)));

    try {
      await bulkInsert(client, 'coupons', availableColumns, rows);
      if (hasLegacyPair || availableColumns.includes('expiry_date')) {
        console.log('ℹ️  Coupon seed compatibility applied for legacy coupon columns.');
      }
      return;
    } catch (error) {
      lastError = error;
      const recoverable = ['42703', '23502', '23514'];
      if (!recoverable.includes(error.code)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Unable to seed coupons with available schema columns.');
}

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🌱 Starting large-scale database seed...\n');

    const seedTableOrder = [
      'order_items',
      'orders',
      'payments',
      'reviews',
      'exchanges',
      'cart',
      'wishlist',
      'product_images',
      'product_variants',
      'size_charts',
      'products',
      'categories',
      'user_addresses',
      'users',
      'coupons',
    ];

    const existingTables = await getExistingTables(client, seedTableOrder);
    if (existingTables.length) {
      const truncateTables = seedTableOrder.filter((table) => existingTables.includes(table)).join(', ');
      await client.query(`TRUNCATE TABLE ${truncateTables} CASCADE`);
    }

    const usersColumns = await getTableColumns(client, 'users');
    const includeIsVerified = usersColumns.has('is_verified');
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    const userColumns = ['email', 'password_hash', 'full_name', 'phone', 'role'];
    if (includeIsVerified) userColumns.push('is_verified');

    const users = [
      ['admin@karaboutique.com', hashedPassword, 'Admin User', '9876500000', 'admin'],
      ['manager@karaboutique.com', hashedPassword, 'Manager User', '9876500001', 'manager'],
    ];

    const customerCount = Math.max(TARGET_USERS - users.length, 0);
    for (let i = 0; i < customerCount; i++) {
      const first = FIRST_NAMES[i % FIRST_NAMES.length];
      const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      const row = [
        `${slugify(first)}.${slugify(last)}${String(i + 1).padStart(3, '0')}@example.com`,
        hashedPassword,
        `${first} ${last}`,
        `98${String(10000000 + i).slice(1)}`,
        'customer',
      ];
      if (includeIsVerified) row.push(true);
      users.push(row);
    }

    const userRows = await bulkInsert(client, 'users', userColumns, users, 'id, email, role');
    const customers = userRows.filter((user) => user.role === 'customer');

    const addressRows = customers.map((customer, index) => {
      const location = CITIES[index % CITIES.length];
      return [
        customer.id,
        `House ${100 + index}, ${location.city} Residency`,
        `Sector ${1 + (index % 20)}`,
        location.city,
        location.state,
        String(Number(location.pincode) + (index % 200)).padStart(6, '0'),
        'India',
        true,
      ];
    });

    await bulkInsert(client, 'user_addresses', ['user_id', 'address_line1', 'address_line2', 'city', 'state', 'pincode', 'country', 'is_default'], addressRows);

    const categoryColumns = await getTableColumns(client, 'categories');
    const categoryInsertColumns = ['name', 'slug'];

    if (categoryColumns.has('description')) {
      categoryInsertColumns.push('description');
    } else if (categoryColumns.has('meta_description')) {
      categoryInsertColumns.push('meta_description');
    }

    if (categoryColumns.has('is_active')) {
      categoryInsertColumns.push('is_active');
    }

    const categoryRows = CATEGORY_CONFIG.map((category) =>
      categoryInsertColumns.map((column) => {
        switch (column) {
          case 'name':
            return category.name;
          case 'slug':
            return category.slug;
          case 'description':
          case 'meta_description':
            return category.description;
          case 'is_active':
            return true;
          default:
            return null;
        }
      })
    );

    const categories = await bulkInsert(client, 'categories', categoryInsertColumns, categoryRows, 'id, slug');

    const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));
    const products = [];

    for (let index = 0; index < TARGET_PRODUCTS; index++) {
      const category = CATEGORY_CONFIG[index % CATEGORY_CONFIG.length];
      const sequence = String(index + 1).padStart(4, '0');
      const color = COLORS[index % COLORS.length];
      const name = `${category.name.slice(0, -1)} ${color} Design ${randomInt(100, 999)}`;
      const basePrice = randomInt(category.baseMin, category.baseMax);
      const discountPrice = Math.max(Math.floor(basePrice * (1 - randomInt(8, 25) / 100)), 1);

      products.push([
        name,
        `${category.slug}-${slugify(color)}-${sequence}`,
        `${name} with premium fabric and handcrafted detailing.`,
        basePrice,
        discountPrice,
        categoryBySlug.get(category.slug),
        index % 20 === 0,
        true,
      ]);
    }

    const productRows = await bulkInsert(
      client,
      'products',
      ['name', 'slug', 'description', 'base_price', 'discount_price', 'category_id', 'is_featured', 'is_active'],
      products,
      'id'
    );

    const variantRows = [];
    const sizeChartRows = [];
    const imageRows = [];

    productRows.forEach((product, index) => {
      const variantSizes = index % 3 === 0 ? ['S', 'M', 'L', 'XL'] : ['S', 'M', 'L'];
      const primaryColor = COLORS[index % COLORS.length];

      variantSizes.forEach((size, sizeIndex) => {
        variantRows.push([
          product.id,
          size,
          primaryColor,
          `KB-${String(index + 1).padStart(4, '0')}-${size}-${primaryColor.slice(0, 2).toUpperCase()}`,
          randomInt(10, 80),
          0,
        ]);

        sizeChartRows.push([
          product.id,
          size,
          `${32 + sizeIndex * 2}-${34 + sizeIndex * 2}`,
          `${26 + sizeIndex * 2}-${28 + sizeIndex * 2}`,
          `${34 + sizeIndex * 2}-${36 + sizeIndex * 2}`,
          `${40 + (index % 5)}`,
        ]);
      });

      const imageBase = index % IMAGE_CATALOG.length;
      imageRows.push([product.id, IMAGE_CATALOG[imageBase], 1, true]);
      imageRows.push([product.id, IMAGE_CATALOG[(imageBase + 1) % IMAGE_CATALOG.length], 2, false]);
    });

    await bulkInsert(client, 'product_variants', ['product_id', 'size', 'color', 'sku', 'stock_quantity', 'reserved_quantity'], variantRows);
    await bulkInsert(client, 'size_charts', ['product_id', 'size', 'bust', 'waist', 'hips', 'length'], sizeChartRows);
    await bulkInsert(client, 'product_images', ['product_id', 'image_url', 'display_order', 'is_primary'], imageRows);

    await seedCoupons(client);

    const variantIdRows = await client.query('SELECT id, product_id FROM product_variants LIMIT 500');
    const addressIdRows = await client.query('SELECT id, user_id FROM user_addresses');
    const addressByUser = new Map(addressIdRows.rows.map((row) => [row.user_id, row.id]));
    const orderStatuses = ['delivered', 'shipped', 'processing', 'placed'];
    const paymentMethods = ['COD', 'UPI', 'CARD', 'NETBANKING'];
    const ordersToCreate = Math.min(300, customers.length * 2);

    const createdOrderDetails = [];
    for (let i = 0; i < ordersToCreate; i++) {
      const customer = customers[i % customers.length];
      const addressId = addressByUser.get(customer.id);
      if (!addressId) continue;

      const variant = variantIdRows.rows[i % variantIdRows.rows.length];
      const quantity = randomInt(1, 3);
      const unitPrice = randomInt(900, 5000);
      const subtotal = quantity * unitPrice;
      const shipping = subtotal >= 1999 ? 0 : 49;
      const discount = subtotal >= 2500 ? Math.round(subtotal * 0.1) : 0;

      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, order_number, total_amount, shipping_charge, discount_amount,
          final_amount, payment_method, shipping_address_id, payment_status, order_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING id`,
        [
          customer.id,
          `ORD-${Date.now()}-${String(i + 1).padStart(4, '0')}`,
          subtotal,
          shipping,
          discount,
          subtotal + shipping - discount,
          paymentMethods[i % paymentMethods.length],
          addressId,
          'paid',
          orderStatuses[i % orderStatuses.length],
        ]
      );

      const orderId = orderResult.rows[0].id;
      await client.query('INSERT INTO order_items (order_id, product_variant_id, quantity, price, subtotal) VALUES ($1,$2,$3,$4,$5)', [orderId, variant.id, quantity, unitPrice, subtotal]);
      createdOrderDetails.push({ orderId, userId: customer.id, productId: variant.product_id });
    }

    const reviewsToCreate = Math.min(250, createdOrderDetails.length);
    for (let i = 0; i < reviewsToCreate; i++) {
      const reviewSeed = createdOrderDetails[i];
      await client.query(
        'INSERT INTO reviews (user_id, product_id, order_id, rating, review_text, is_verified) VALUES ($1,$2,$3,$4,$5,true)',
        [reviewSeed.userId, reviewSeed.productId, reviewSeed.orderId, randomInt(3, 5), `Great value for money. Review sample #${i + 1}.`]
      );
    }

    const wishlistRows = [];
    const cartRows = [];
    for (let i = 0; i < Math.min(200, customers.length * 2); i++) {
      const customer = customers[i % customers.length];
      const variant = variantIdRows.rows[i % variantIdRows.rows.length];
      wishlistRows.push([customer.id, variant.product_id]);
      cartRows.push([customer.id, variant.id, randomInt(1, 3)]);
    }

    await bulkInsert(client, 'wishlist', ['user_id', 'product_id'], wishlistRows);
    await bulkInsert(client, 'cart', ['user_id', 'product_variant_id', 'quantity'], cartRows);

    await client.query('COMMIT');

    console.log('\n✅ DATABASE SEEDING COMPLETED');
    console.log(`Users: ${userRows.length}, Products: ${productRows.length}, Variants: ${variantRows.length}, Orders: ${createdOrderDetails.length}`);
    console.log(`Reviews: ${reviewsToCreate}, Wishlist: ${wishlistRows.length}, Cart: ${cartRows.length}`);
    console.log('ℹ️  Override volumes using SEED_USER_COUNT and SEED_PRODUCT_COUNT.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

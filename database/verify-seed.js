const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kara_boutique',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const minUsers = Number(process.env.SEED_USER_COUNT || 100);
const minProducts = Number(process.env.SEED_PRODUCT_COUNT || 1200);
const reportFile = process.env.SEED_REPORT_FILE || '';

async function queryCount(client, sql) {
  const result = await client.query(sql);
  return Number(result.rows[0].count);
}

async function verify() {
  const client = await pool.connect();
  try {
    const counts = {
      users: await queryCount(client, 'SELECT COUNT(*)::int as count FROM users'),
      categories: await queryCount(client, 'SELECT COUNT(*)::int as count FROM categories'),
      products: await queryCount(client, 'SELECT COUNT(*)::int as count FROM products'),
      variants: await queryCount(client, 'SELECT COUNT(*)::int as count FROM product_variants'),
      images: await queryCount(client, 'SELECT COUNT(*)::int as count FROM product_images'),
      orders: await queryCount(client, 'SELECT COUNT(*)::int as count FROM orders'),
      orderItems: await queryCount(client, 'SELECT COUNT(*)::int as count FROM order_items'),
      reviews: await queryCount(client, 'SELECT COUNT(*)::int as count FROM reviews'),
      wishlist: await queryCount(client, 'SELECT COUNT(*)::int as count FROM wishlist'),
      cart: await queryCount(client, 'SELECT COUNT(*)::int as count FROM cart'),
    };

    const requiredChecks = [
      { ok: counts.users >= minUsers, message: `users >= ${minUsers}` },
      { ok: counts.products >= minProducts, message: `products >= ${minProducts}` },
      { ok: counts.categories >= 8, message: 'categories >= 8' },
      { ok: counts.variants >= counts.products * 3, message: 'variants >= products * 3' },
      { ok: counts.orders > 0, message: 'orders > 0' },
      { ok: counts.orderItems >= counts.orders, message: 'order_items >= orders' },
      { ok: counts.reviews > 0, message: 'reviews > 0' },
    ];

    const fkChecks = {
      reviewsWithoutOrder: await queryCount(client, 'SELECT COUNT(*)::int as count FROM reviews r LEFT JOIN orders o ON o.id = r.order_id WHERE o.id IS NULL'),
      wishlistWithoutProduct: await queryCount(client, 'SELECT COUNT(*)::int as count FROM wishlist w LEFT JOIN products p ON p.id = w.product_id WHERE p.id IS NULL'),
      cartWithoutVariant: await queryCount(client, 'SELECT COUNT(*)::int as count FROM cart c LEFT JOIN product_variants pv ON pv.id = c.product_variant_id WHERE pv.id IS NULL'),
    };

    const fkAssertions = [
      { ok: fkChecks.reviewsWithoutOrder === 0, message: 'reviews have valid order references' },
      { ok: fkChecks.wishlistWithoutProduct === 0, message: 'wishlist has valid product references' },
      { ok: fkChecks.cartWithoutVariant === 0, message: 'cart has valid variant references' },
    ];

    console.log('📊 Seed verification counts:', counts);

    const allChecks = [...requiredChecks, ...fkAssertions];
    const failures = allChecks.filter((check) => !check.ok);

    if (reportFile) {
      const fs = require('fs');
      const path = require('path');
      const payload = {
        generated_at: new Date().toISOString(),
        thresholds: { minUsers, minProducts },
        counts,
        fkChecks,
        checks: allChecks,
        passed: failures.length === 0,
      };
      fs.mkdirSync(path.dirname(reportFile), { recursive: true });
      fs.writeFileSync(reportFile, JSON.stringify(payload, null, 2));
      console.log(`🧾 Seed report written to ${reportFile}`);
    }

    if (failures.length > 0) {
      failures.forEach((failure) => console.error(`❌ ${failure.message}`));
      process.exitCode = 1;
      return;
    }

    console.log('✅ Seed verification passed.');
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch((error) => {
  console.error('❌ Seed verification failed with error:', error.message);
  process.exit(1);
});

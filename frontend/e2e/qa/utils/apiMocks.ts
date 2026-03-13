import { Page, Route } from '@playwright/test';
import testData from '../data/testData.json';

const API = 'http://localhost:5000/api/v1';

function ok(route: Route, data: any) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  });
}

export async function mockCommonApis(page: Page) {
  await page.route(`${API}/auth/me`, (route) => ok(route, testData.users.customer));
  await page.route(`${API}/categories*`, async (route) => {
    if (route.request().method() === 'POST') return ok(route, { id: 'c-new', name: 'New Category', slug: 'new-category' });
    if (route.request().method() === 'PUT') return ok(route, { id: 'c1', ...testData.categories[0], is_active: false });
    return ok(route, testData.categories);
  });

  await page.route(`${API}/products/featured*`, (route) => ok(route, testData.products));
  await page.route(`${API}/products/slug/*`, (route) => ok(route, { ...testData.products[0], variants: [{ id: 'v1', size: 'M', color: 'Black', stock_quantity: 10 }] }));
  await page.route(`${API}/products/low-stock*`, (route) => ok(route, [{ id: 'v1', product_id: 'p1', product_name: 'Royal Saree', size: 'M', color: 'Black', sku: 'SKU-1', stock_quantity: 5, reserved_quantity: 3 }]));
  await page.route(`${API}/products*`, async (route) => {
    const method = route.request().method();
    if (method === 'POST') return ok(route, { id: 'p-new', ...testData.products[0] });
    if (method === 'PUT') return ok(route, { id: 'p1', ...testData.products[0], is_active: false });
    return ok(route, { products: testData.products, pagination: { page: 1, limit: 20, total: 2, totalPages: 1 } });
  });

  await page.route(`${API}/orders/admin/all*`, (route) => ok(route, { orders: testData.orders, pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }));
  await page.route(`${API}/orders/*`, async (route) => {
    if (route.request().method() === 'PUT') return ok(route, { id: 'o1', order_status: 'shipped' });
    return ok(route, {
      ...testData.orders[0],
      user_phone: '9999999999',
      total_amount: 3000,
      shipping_charge: 0,
      discount_amount: 0,
      payment_method: 'COD',
      tracking_number: '',
      shipping_address: { address_line1: 'Street 1', city: 'Bengaluru', state: 'KA', pincode: '560001', country: 'India' },
      items: [{ id: 'i1', product_name: 'Royal Saree', variant_size: 'M', variant_color: 'Black', quantity: 2, price: 1500, subtotal: 3000, product_image: '/uploads/sample.jpg' }]
    });
  });

  await page.route(`${API}/admin/settings*`, async (route) => {
    if (route.request().method() === 'PUT') return ok(route, { saved: true });
    return ok(route, {
      general: { store_name: 'Kara Boutique', store_email: 'support@test.com', support_contact_number: '+91 9999999999', default_currency: 'INR' },
      user: { guest_checkout_enabled: true, email_verification_required: false, account_lockout_enabled: true },
      product: { sku_auto_generation: true, inventory_tracking_enabled: true, low_stock_alert_threshold: 10, allow_backorders: false, review_moderation_mode: 'manual' },
      order: { return_window_days: 7, auto_cancel_unpaid_minutes: 30, invoice_auto_generation: true, allow_returns: true, allow_exchanges: true, order_editing_after_placement: false },
      payment: { enable_card: true, enable_upi: true, enable_netbanking: true, enable_wallet: true, cod_default_enabled: false, cod_enabled_pincodes: ['560001'], minimum_order_value: 0, payment_timeout_minutes: 15 },
      shipping: { flat_rate_shipping: 49, free_shipping_threshold: 1499, estimated_delivery_days: 5 },
      notification: { email_enabled: true, sms_enabled: false, whatsapp_enabled: false, admin_order_alerts: true, low_stock_alerts: true },
      system: { maintenance_mode: false, feature_flags_enabled: true }
    });
  });

  await page.route(`${API}/products/bulk`, (route) => ok(route, { action: 'create', total: 1, success: 1, failed: 0, results: [{ index: 0, status: 'success' }] }));
  await page.route(`${API}/categories/bulk`, (route) => ok(route, { action: 'create', total: 1, success: 1, failed: 0, results: [{ index: 0, status: 'success' }] }));
}

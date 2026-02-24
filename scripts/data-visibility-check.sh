#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:5000/api/v1}"
HEALTH_URL="${HEALTH_URL:-http://localhost:5000/health}"

printf "\n🔎 Data Visibility Smoke Check\n"
printf "API_BASE_URL=%s\n" "$API_BASE_URL"
printf "HEALTH_URL=%s\n\n" "$HEALTH_URL"

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl is required but not installed."
  exit 1
fi

health_response="$(curl -fsS "$HEALTH_URL")"
echo "✅ /health responded"

products_response="$(curl -fsS "$API_BASE_URL/products?limit=12&page=1")"
featured_response="$(curl -fsS "$API_BASE_URL/products/featured")"
categories_response="$(curl -fsS "$API_BASE_URL/categories")"

node - "$health_response" "$products_response" "$featured_response" "$categories_response" <<'NODE'
const [healthRaw, productsRaw, featuredRaw, categoriesRaw] = process.argv.slice(2);

function safeJson(raw, name) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Could not parse ${name} response as JSON`);
    process.exit(1);
  }
}

const health = safeJson(healthRaw, 'health');
const products = safeJson(productsRaw, 'products');
const featured = safeJson(featuredRaw, 'featured products');
const categories = safeJson(categoriesRaw, 'categories');

const productsPayload = products?.data?.products ?? products?.data ?? [];
const featuredPayload = featured?.data?.products ?? featured?.data ?? [];
const categoriesPayload = categories?.data?.categories ?? categories?.data ?? [];

const productCount = Array.isArray(productsPayload) ? productsPayload.length : 0;
const featuredCount = Array.isArray(featuredPayload) ? featuredPayload.length : 0;
const categoryCount = Array.isArray(categoriesPayload) ? categoriesPayload.length : 0;

if (health?.status !== 'OK') {
  console.error('❌ Health endpoint did not return status=OK');
  process.exit(1);
}

if (productCount === 0) {
  console.error('❌ Products endpoint returned 0 items. Seed data is not visible yet.');
  process.exit(1);
}

if (categoryCount === 0) {
  console.error('❌ Categories endpoint returned 0 items. Seed/category load likely failed.');
  process.exit(1);
}

console.log('✅ Parsed API responses successfully');
console.log(`📦 Products visible on page 1: ${productCount}`);
console.log(`⭐ Featured products visible: ${featuredCount}`);
console.log(`🗂️ Categories visible: ${categoryCount}`);
console.log('🎉 Seed data visibility check passed.');
NODE

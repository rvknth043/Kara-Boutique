import { query } from '../config/database';

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // You might want to create a test database here
  console.log('Test environment setup complete');
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  // await pool.end();
  console.log('Test environment cleanup complete');
});

// Clear data before each test
beforeEach(async () => {
  // Clear test data if needed
});

// Global test utilities
global.createTestUser = async (data: any) => {
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [data.email, data.password_hash, data.full_name, data.role || 'customer']
  );
  return result.rows[0];
};

global.createTestProduct = async (data: any) => {
  const result = await query(
    `INSERT INTO products (name, slug, description, base_price, category_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [data.name, data.slug, data.description, data.base_price, data.category_id]
  );
  return result.rows[0];
};

declare global {
  function createTestUser(data: any): Promise<any>;
  function createTestProduct(data: any): Promise<any>;
}

export {};

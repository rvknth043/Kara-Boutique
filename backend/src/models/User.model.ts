import { pool, query } from '../config/database';
import { User, UserRole } from '../types/shared.types';

export interface CreateUserData {
  full_name: string;
  email: string;
  phone?: string;
  password_hash?: string;
  google_id?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

export class UserModel {
  /**
   * Create new user
   */
  static async create(data: CreateUserData): Promise<User> {
    const sql = `
      INSERT INTO users (full_name, email, phone, password_hash, google_id, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.full_name,
      data.email,
      data.phone || null,
      data.password_hash || null,
      data.google_id || null,
      data.role || UserRole.CUSTOMER,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by phone
   */
  static async findByPhone(phone: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE phone = $1';
    const result = await query(sql, [phone]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by Google ID
   */
  static async findByGoogleId(googleId: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE google_id = $1';
    const result = await query(sql, [googleId]);
    return result.rows[0] || null;
  }
  
  /**
   * Update user
   */
  static async update(id: string, data: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.full_name !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(data.full_name);
    }
    
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete user (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'UPDATE users SET is_active = false WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Get all users (admin only)
   */
  static async getAll(
    page: number = 1,
    limit: number = 20,
    role?: UserRole
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM users';
    let countSql = 'SELECT COUNT(*) as total FROM users';
    const values: any[] = [];
    
    if (role) {
      sql += ' WHERE role = $1';
      countSql += ' WHERE role = $1';
      values.push(role);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    
    const [usersResult, countResult] = await Promise.all([
      query(sql, [...values, limit, offset]),
      query(countSql, values),
    ]);
    
    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const sql = 'SELECT id FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows.length > 0;
  }
  
  /**
   * Check if phone exists
   */
  static async phoneExists(phone: string): Promise<boolean> {
    const sql = 'SELECT id FROM users WHERE phone = $1';
    const result = await query(sql, [phone]);
    return result.rows.length > 0;
  }
}

export default UserModel;

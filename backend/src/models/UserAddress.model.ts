import { query } from '../config/database';

export interface UserAddress {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: Date;
}

export interface CreateAddressData {
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  is_default?: boolean;
}

export interface UpdateAddressData {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  is_default?: boolean;
}

export class UserAddressModel {
  /**
   * Create address
   */
  static async create(data: CreateAddressData): Promise<UserAddress> {
    // If setting as default, unset other defaults first
    if (data.is_default) {
      await query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [data.user_id]
      );
    }
    
    const sql = `
      INSERT INTO user_addresses (
        user_id, address_line1, address_line2, city, state, 
        pincode, country, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.address_line1,
      data.address_line2 || null,
      data.city,
      data.state,
      data.pincode,
      data.country || 'India',
      data.is_default || false,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Find address by ID
   */
  static async findById(id: string): Promise<UserAddress | null> {
    const sql = 'SELECT * FROM user_addresses WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get user's addresses
   */
  static async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const sql = `
      SELECT * FROM user_addresses 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }
  
  /**
   * Get default address
   */
  static async getDefaultAddress(userId: string): Promise<UserAddress | null> {
    const sql = `
      SELECT * FROM user_addresses 
      WHERE user_id = $1 AND is_default = true 
      LIMIT 1
    `;
    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }
  
  /**
   * Update address
   */
  static async update(id: string, userId: string, data: UpdateAddressData): Promise<UserAddress | null> {
    // If setting as default, unset other defaults first
    if (data.is_default) {
      await query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.address_line1 !== undefined) {
      fields.push(`address_line1 = $${paramCount++}`);
      values.push(data.address_line1);
    }
    
    if (data.address_line2 !== undefined) {
      fields.push(`address_line2 = $${paramCount++}`);
      values.push(data.address_line2);
    }
    
    if (data.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(data.city);
    }
    
    if (data.state !== undefined) {
      fields.push(`state = $${paramCount++}`);
      values.push(data.state);
    }
    
    if (data.pincode !== undefined) {
      fields.push(`pincode = $${paramCount++}`);
      values.push(data.pincode);
    }
    
    if (data.country !== undefined) {
      fields.push(`country = $${paramCount++}`);
      values.push(data.country);
    }
    
    if (data.is_default !== undefined) {
      fields.push(`is_default = $${paramCount++}`);
      values.push(data.is_default);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id, userId);
    
    const sql = `
      UPDATE user_addresses
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete address
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM user_addresses 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await query(sql, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Check if address belongs to user
   */
  static async belongsToUser(addressId: string, userId: string): Promise<boolean> {
    const sql = `
      SELECT id FROM user_addresses 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await query(sql, [addressId, userId]);
    return result.rows.length > 0;
  }
}

export default UserAddressModel;

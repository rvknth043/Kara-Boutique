import { query } from '../config/database';

export interface StorefrontSettings {
  allow_returns: boolean;
  allow_exchanges: boolean;
  cod_default_enabled: boolean;
  cod_enabled_pincodes: string[];
}

const DEFAULT_SETTINGS: StorefrontSettings = {
  allow_returns: true,
  allow_exchanges: true,
  cod_default_enabled: false,
  cod_enabled_pincodes: [],
};

export default class StorefrontSettingsService {
  static async ensureTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  static normalizeSettings(raw: Record<string, any> = {}): StorefrontSettings {
    return {
      allow_returns: raw.allow_returns !== false,
      allow_exchanges: raw.allow_exchanges !== false,
      cod_default_enabled: raw.cod_default_enabled === true,
      cod_enabled_pincodes: Array.isArray(raw.cod_enabled_pincodes)
        ? raw.cod_enabled_pincodes.filter((p) => typeof p === 'string' && /^\d{6}$/.test(p))
        : [],
    };
  }

  static async getSettings(): Promise<StorefrontSettings> {
    await this.ensureTable();
    const result = await query('SELECT value FROM app_settings WHERE key = $1', ['storefront']);
    if (!result.rows.length) return DEFAULT_SETTINGS;
    return this.normalizeSettings(result.rows[0].value || {});
  }

  static async updateSettings(input: Record<string, any>): Promise<StorefrontSettings> {
    await this.ensureTable();
    const settings = this.normalizeSettings(input);
    await query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      ['storefront', JSON.stringify(settings)]
    );
    return settings;
  }
}

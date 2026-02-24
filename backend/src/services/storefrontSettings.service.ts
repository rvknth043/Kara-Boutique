import { query } from '../config/database';

export interface StorefrontSettings {
  general: {
    store_name: string;
    store_email: string;
    support_contact_number: string;
    store_address: string;
    default_currency: string;
    time_zone: string;
    default_language: string;
    date_time_format: string;
  };
  user: {
    guest_checkout_enabled: boolean;
    email_verification_required: boolean;
    account_lockout_enabled: boolean;
  };
  product: {
    sku_auto_generation: boolean;
    inventory_tracking_enabled: boolean;
    low_stock_alert_threshold: number;
    allow_backorders: boolean;
    review_moderation_mode: 'auto' | 'manual';
  };
  order: {
    return_window_days: number;
    auto_cancel_unpaid_minutes: number;
    invoice_auto_generation: boolean;
    allow_returns: boolean;
    allow_exchanges: boolean;
    order_editing_after_placement: boolean;
  };
  payment: {
    enable_card: boolean;
    enable_upi: boolean;
    enable_netbanking: boolean;
    enable_wallet: boolean;
    cod_default_enabled: boolean;
    cod_enabled_pincodes: string[];
    minimum_order_value: number;
    payment_timeout_minutes: number;
  };
  shipping: {
    flat_rate_shipping: number;
    free_shipping_threshold: number;
    estimated_delivery_days: number;
  };
  notification: {
    email_enabled: boolean;
    sms_enabled: boolean;
    whatsapp_enabled: boolean;
    admin_order_alerts: boolean;
    low_stock_alerts: boolean;
  };
  system: {
    maintenance_mode: boolean;
    feature_flags_enabled: boolean;
  };
  // Backward-compatible aliases consumed in existing frontend/backend code.
  allow_returns: boolean;
  allow_exchanges: boolean;
  cod_default_enabled: boolean;
  cod_enabled_pincodes: string[];
}

const DEFAULT_SETTINGS: StorefrontSettings = {
  general: {
    store_name: 'Kara Boutique',
    store_email: 'support@karaboutique.com',
    support_contact_number: '+91 9876543210',
    store_address: 'India',
    default_currency: 'INR',
    time_zone: 'Asia/Kolkata',
    default_language: 'en',
    date_time_format: 'DD/MM/YYYY HH:mm',
  },
  user: {
    guest_checkout_enabled: true,
    email_verification_required: false,
    account_lockout_enabled: true,
  },
  product: {
    sku_auto_generation: true,
    inventory_tracking_enabled: true,
    low_stock_alert_threshold: 10,
    allow_backorders: false,
    review_moderation_mode: 'manual',
  },
  order: {
    return_window_days: 7,
    auto_cancel_unpaid_minutes: 30,
    invoice_auto_generation: true,
    allow_returns: true,
    allow_exchanges: true,
    order_editing_after_placement: false,
  },
  payment: {
    enable_card: true,
    enable_upi: true,
    enable_netbanking: true,
    enable_wallet: true,
    cod_default_enabled: false,
    cod_enabled_pincodes: [],
    minimum_order_value: 0,
    payment_timeout_minutes: 15,
  },
  shipping: {
    flat_rate_shipping: 49,
    free_shipping_threshold: 1499,
    estimated_delivery_days: 5,
  },
  notification: {
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    admin_order_alerts: true,
    low_stock_alerts: true,
  },
  system: {
    maintenance_mode: false,
    feature_flags_enabled: true,
  },
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
    const order = {
      ...DEFAULT_SETTINGS.order,
      ...(raw.order || {}),
      allow_returns: raw.allow_returns ?? raw.order?.allow_returns ?? DEFAULT_SETTINGS.order.allow_returns,
      allow_exchanges: raw.allow_exchanges ?? raw.order?.allow_exchanges ?? DEFAULT_SETTINGS.order.allow_exchanges,
    };

    const codPincodes = raw.cod_enabled_pincodes ?? raw.payment?.cod_enabled_pincodes;
    const payment = {
      ...DEFAULT_SETTINGS.payment,
      ...(raw.payment || {}),
      cod_default_enabled: raw.cod_default_enabled ?? raw.payment?.cod_default_enabled ?? DEFAULT_SETTINGS.payment.cod_default_enabled,
      cod_enabled_pincodes: Array.isArray(codPincodes)
        ? codPincodes.filter((p: unknown) => typeof p === 'string' && /^\d{6}$/.test(p))
        : [],
    };

    const settings: StorefrontSettings = {
      general: {
        ...DEFAULT_SETTINGS.general,
        ...(raw.general || {}),
      },
      user: {
        ...DEFAULT_SETTINGS.user,
        ...(raw.user || {}),
      },
      product: {
        ...DEFAULT_SETTINGS.product,
        ...(raw.product || {}),
      },
      order,
      payment,
      shipping: {
        ...DEFAULT_SETTINGS.shipping,
        ...(raw.shipping || {}),
      },
      notification: {
        ...DEFAULT_SETTINGS.notification,
        ...(raw.notification || {}),
      },
      system: {
        ...DEFAULT_SETTINGS.system,
        ...(raw.system || {}),
      },
      allow_returns: order.allow_returns,
      allow_exchanges: order.allow_exchanges,
      cod_default_enabled: payment.cod_default_enabled,
      cod_enabled_pincodes: payment.cod_enabled_pincodes,
    };

    return settings;
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type LowStockVariant = {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  size?: string;
  color?: string;
  stock_quantity?: number;
  reserved_quantity?: number;
};

const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [lowStockVariants, setLowStockVariants] = useState<LowStockVariant[]>([]);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/low-stock');
      const products = response.data?.data || [];
      setLowStockVariants(Array.isArray(products) ? products : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load inventory data');
      setLowStockVariants([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Inventory</h2>
          <p className="text-muted mb-0">Monitor low-stock variants and quickly navigate to product management.</p>
        </div>
        <Link href="/admin/products" className="btn btn-primary">Go to Products</Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Low Stock Alerts</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchLowStockProducts}>
            Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : lowStockVariants.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="mb-1">No low-stock items right now 🎉</p>
              <small>Inventory levels look healthy.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>SKU</th>
                    <th>Available Stock</th>
                    <th>Total Stock</th>
                    <th>Reserved</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockVariants.map((variant) => {
                    const totalStock = asNumber(variant.stock_quantity);
                    const reserved = asNumber(variant.reserved_quantity);
                    const available = Math.max(totalStock - reserved, 0);

                    return (
                      <tr key={variant.id}>
                        <td>
                          <div className="fw-medium">{variant.product_name || 'Unnamed Product'}</div>
                          <small className="text-muted">Product ID: {variant.product_id}</small>
                        </td>
                        <td>{variant.size || '-'} / {variant.color || '-'}</td>
                        <td><code>{variant.sku || '-'}</code></td>
                        <td>
                          <span className={`badge ${available <= 2 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            {available}
                          </span>
                        </td>
                        <td>{totalStock}</td>
                        <td>{reserved}</td>
                        <td>
                          <Link href={`/admin/products/${variant.product_id}/edit`} className="btn btn-sm btn-outline-primary">
                            Update Stock
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

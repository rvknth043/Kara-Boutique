'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const response = await api.get('/products/low-stock');
      const products = response.data?.data || [];
      setLowStockProducts(Array.isArray(products) ? products : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load inventory data');
      setLowStockProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Inventory</h2>
          <p className="text-muted mb-0">Monitor low-stock products and quickly navigate to product management.</p>
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
          ) : lowStockProducts.length === 0 ? (
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
                    <th>Category</th>
                    <th>Available Stock</th>
                    <th>Total Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="fw-medium">{product.name}</div>
                        <small className="text-muted">{product.slug}</small>
                      </td>
                      <td>{product.category_name || '-'}</td>
                      <td>
                        <span className="badge bg-danger">{product.available_stock ?? 0}</span>
                      </td>
                      <td>{product.total_stock ?? 0}</td>
                      <td>
                        <Link href={`/admin/products/${product.id}/edit`} className="btn btn-sm btn-outline-primary">
                          Update Stock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

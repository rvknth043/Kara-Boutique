'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/products${params}`);
      setProducts(response.data.data.products || response.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await api.put(`/products/${productId}`, { is_active: !currentStatus });
      toast.success('Product status updated');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      await api.put(`/products/${productId}`, { is_featured: !currentStatus });
      toast.success('Featured status updated');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update featured status');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Product Management</h2>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Add New Product
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-3">
            <div className="col-md-10">
              <input
                type="text"
                className="form-control"
                placeholder="Search products by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No products found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>Image</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <Image
                          src={product.images?.[0]?.image_url || '/placeholder.jpg'}
                          alt={product.name}
                          width={60}
                          height={80}
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                      </td>
                      <td>
                        <div className="fw-medium">{product.name}</div>
                        <small className="text-muted">{product.slug}</small>
                      </td>
                      <td>{product.category_name || '-'}</td>
                      <td>
                        <div>₹{product.base_price.toLocaleString('en-IN')}</div>
                        {product.discount_price && (
                          <small className="text-success">
                            Sale: ₹{product.discount_price.toLocaleString('en-IN')}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={product.total_stock > 0 ? 'text-success' : 'text-danger'}>
                          {product.total_stock || 0}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(product.id, product.is_active)}
                          className={`btn btn-sm ${
                            product.is_active ? 'btn-success' : 'btn-secondary'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                          className={`btn btn-sm ${
                            product.is_featured ? 'btn-warning' : 'btn-outline-secondary'
                          }`}
                        >
                          {product.is_featured ? '⭐ Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/products/${product.slug}`}
                            className="btn btn-sm btn-outline-secondary"
                            target="_blank"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

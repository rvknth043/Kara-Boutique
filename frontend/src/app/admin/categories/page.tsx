'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [bulkAction, setBulkAction] = useState<'create' | 'update' | 'delete'>('create');
  const [bulkJson, setBulkJson] = useState('[\n  {\n    "name": "New Category"\n  }\n]');

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories?include_inactive=true');
      setCategories(response.data?.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.post('/categories', { name: name.trim() });
      toast.success('Category created');
      setName('');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create category');
    }
  };

  const handleToggleStatus = async (category: any) => {
    try {
      await api.put(`/categories/${category.id}`, { is_active: !category.is_active });
      toast.success('Category updated');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update category');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let items: any[] = [];
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('Bulk payload must be a non-empty JSON array');
        return;
      }
      items = parsed;
    } catch {
      toast.error('Invalid JSON payload');
      return;
    }

    try {
      const response = await api.post('/categories/bulk', {
        action: bulkAction,
        items,
      });
      const result = response.data?.data;
      toast.success(`Bulk ${bulkAction}: ${result?.success || 0} success, ${result?.failed || 0} failed`);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Bulk operation failed');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Category Management</h2>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Create Category</h5>
          <form onSubmit={handleCreate} className="row g-2">
            <div className="col-md-10">
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" type="submit">Create</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Bulk Upload / Bulk CRUD</h5>
          <p className="text-muted small">For update/delete operations each item must include <code>id</code>.</p>
          <form onSubmit={handleBulkSubmit}>
            <div className="row g-2 mb-2">
              <div className="col-md-3">
                <select className="form-select" value={bulkAction} onChange={(e) => setBulkAction(e.target.value as any)}>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
              <div className="col-md-9 text-md-end">
                <button type="submit" className="btn btn-outline-primary">Run Bulk Operation</button>
              </div>
            </div>
            <textarea className="form-control font-monospace" rows={9} value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.slug}</td>
                      <td>{category.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleToggleStatus(category)}>
                          Toggle Status
                        </button>
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

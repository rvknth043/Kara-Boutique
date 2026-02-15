'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductFormPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const isEdit = !!productId;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    base_price: '',
    discount_price: '',
    is_featured: false,
    is_active: true,
  });
  const [variants, setVariants] = useState([
    { size: 'S', color: 'Black', stock_quantity: 0, sku: '' }
  ]);
  const [sizeChart, setSizeChart] = useState([
    { size: 'S', bust: '', waist: '', hips: '', length: '' }
  ]);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [isAdmin, productId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data.data;
      
      setFormData({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        base_price: product.base_price,
        discount_price: product.discount_price || '',
        is_featured: product.is_featured,
        is_active: product.is_active,
      });

      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants.map((v: any) => ({
          size: v.size,
          color: v.color,
          stock_quantity: v.stock_quantity,
          sku: v.sku || '',
        })));
      }

      if (product.size_chart && product.size_chart.length > 0) {
        setSizeChart(product.size_chart);
      }
    } catch (error) {
      toast.error('Failed to load product');
      router.push('/admin/products');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([...variants, { size: 'M', color: 'Black', stock_quantity: 0, sku: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSizeChartChange = (index: number, field: string, value: string) => {
    const updated = [...sizeChart];
    updated[index] = { ...updated[index], [field]: value };
    setSizeChart(updated);
  };

  const addSizeChartRow = () => {
    setSizeChart([...sizeChart, { size: 'M', bust: '', waist: '', hips: '', length: '' }]);
  };

  const removeSizeChartRow = (index: number) => {
    setSizeChart(sizeChart.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        variants: variants.map(v => ({
          ...v,
          stock_quantity: parseInt(v.stock_quantity.toString()),
        })),
        size_chart: sizeChart.filter(s => s.bust || s.waist || s.hips || s.length),
      };

      if (isEdit) {
        await api.put(`/products/${productId}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully');
      }

      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
        <button onClick={() => router.push('/admin/products')} className="btn btn-outline-secondary">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="card mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Category *</label>
                <select
                  name="category_id"
                  className="form-select"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Base Price (₹) *</label>
                <input
                  type="number"
                  name="base_price"
                  className="form-control"
                  value={formData.base_price}
                  onChange={handleChange}
                  step="0.01"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Discount Price (₹)</label>
                <input
                  type="number"
                  name="discount_price"
                  className="form-control"
                  value={formData.discount_price}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Status</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      type="checkbox"
                      name="is_active"
                      className="form-check-input"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">Active</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      type="checkbox"
                      name="is_featured"
                      className="form-check-input"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="is_featured">Featured</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="card mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Product Variants</h5>
            <button type="button" onClick={addVariant} className="btn btn-sm btn-primary">
              + Add Variant
            </button>
          </div>
          <div className="card-body">
            {variants.map((variant, index) => (
              <div key={index} className="row g-3 mb-3 pb-3 border-bottom">
                <div className="col-md-3">
                  <label className="form-label">Size *</label>
                  <select
                    className="form-select"
                    value={variant.size}
                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                    required
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Color *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={variant.color}
                    onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Stock *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={variant.stock_quantity}
                    onChange={(e) => handleVariantChange(index, 'stock_quantity', parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-control"
                    value={variant.sku}
                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="col-md-1 d-flex align-items-end">
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="btn btn-outline-danger w-100"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Chart */}
        <div className="card mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Size Chart (Optional)</h5>
            <button type="button" onClick={addSizeChartRow} className="btn btn-sm btn-outline-primary">
              + Add Size
            </button>
          </div>
          <div className="card-body">
            {sizeChart.map((row, index) => (
              <div key={index} className="row g-3 mb-3">
                <div className="col-md-2">
                  <label className="form-label">Size</label>
                  <select
                    className="form-select"
                    value={row.size}
                    onChange={(e) => handleSizeChartChange(index, 'size', e.target.value)}
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Bust (inches)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.bust}
                    onChange={(e) => handleSizeChartChange(index, 'bust', e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Waist (inches)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.waist}
                    onChange={(e) => handleSizeChartChange(index, 'waist', e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Hips (inches)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.hips}
                    onChange={(e) => handleSizeChartChange(index, 'hips', e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Length (inches)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.length}
                    onChange={(e) => handleSizeChartChange(index, 'length', e.target.value)}
                  />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  {sizeChart.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSizeChartRow(index)}
                      className="btn btn-outline-danger w-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="btn btn-outline-secondary btn-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

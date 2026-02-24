'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import Loading from '@/components/common/Loading';
import api, { endpoints } from '@/lib/api';

const PRICE_MIN = 0;
const PRICE_MAX = 30000;

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    min_price: PRICE_MIN,
    max_price: PRICE_MAX,
    sort_by: 'created_at',
    sort_order: 'DESC',
  });

  const searchQuery = searchParams.get('search');

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let url = endpoints.products.getAll;
      const params: Record<string, string | number> = {
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      if (filters.min_price > PRICE_MIN) params.min_price = filters.min_price;
      if (filters.max_price < PRICE_MAX) params.max_price = filters.max_price;

      if (searchQuery) {
        url = endpoints.products.search;
        params.q = searchQuery;
      }

      const response = await api.get(url, { params });
      const payload = response.data?.data;
      setProducts(Array.isArray(payload?.products) ? payload.products : Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: 'sort_by' | 'sort_order', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleMinSlider = (value: number) => {
    setFilters((prev) => ({
      ...prev,
      min_price: Math.min(value, prev.max_price - 500),
    }));
  };

  const handleMaxSlider = (value: number) => {
    setFilters((prev) => ({
      ...prev,
      max_price: Math.max(value, prev.min_price + 500),
    }));
  };

  const clearFilters = () => {
    setFilters({
      min_price: PRICE_MIN,
      max_price: PRICE_MAX,
      sort_by: 'created_at',
      sort_order: 'DESC',
    });
  };

  return (
    <>
      <Header />

      <main className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="mb-4">Filters</h5>

                  <div className="mb-4">
                    <h6 className="mb-3">Select a Range</h6>
                    <div className="position-relative px-1" style={{ height: 52 }}>
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={100}
                        value={filters.min_price}
                        onChange={(e) => handleMinSlider(Number(e.target.value))}
                        className="form-range position-absolute top-0 start-0 w-100"
                      />
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={100}
                        value={filters.max_price}
                        onChange={(e) => handleMaxSlider(Number(e.target.value))}
                        className="form-range position-absolute top-0 start-0 w-100"
                      />
                    </div>
                    <div className="d-flex justify-content-between mt-2 fw-medium">
                      <span>₹{filters.min_price.toLocaleString('en-IN')}</span>
                      <span>₹{filters.max_price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="mb-3">Sort By</h6>
                    <select
                      className="form-select form-select-sm"
                      value={filters.sort_by}
                      onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    >
                      <option value="created_at">Newest First</option>
                      <option value="base_price">Price: Low to High</option>
                      <option value="name">Name</option>
                      <option value="view_count">Most Popular</option>
                    </select>
                  </div>

                  <button onClick={clearFilters} className="btn btn-outline-secondary btn-sm w-100">
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="mb-4">
                <h2>{searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}</h2>
                <p className="text-muted">{products.length} products found</p>
              </div>

              {loading ? (
                <Loading />
              ) : products.length > 0 ? (
                <div className="row g-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="col-6 col-md-4">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <h4 className="text-muted">No products found</h4>
                  <p>Try adjusting your filters or search term</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsContent />
    </Suspense>
  );
}

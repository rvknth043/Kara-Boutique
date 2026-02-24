'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import Loading from '@/components/common/Loading';
import api, { endpoints } from '@/lib/api';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
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
      const params: any = {
        ...filters,
      };

      if (searchQuery) {
        url = endpoints.products.search;
        params.q = searchQuery;
      }

      const response = await api.get(url, { params });
      setProducts(response.data.data.products || response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Header />
      
      <main className="py-5">
        <div className="container">
          <div className="row">
            {/* Filters Sidebar */}
            <div className="col-lg-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="mb-4">Filters</h5>

                  {/* Price Range */}
                  <div className="mb-4">
                    <h6 className="mb-3">Price Range</h6>
                    <div className="mb-2">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Min Price"
                        value={filters.min_price}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Max Price"
                        value={filters.max_price}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Sort By */}
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

                  <button
                    onClick={() => setFilters({
                      min_price: '',
                      max_price: '',
                      sort_by: 'created_at',
                      sort_order: 'DESC',
                    })}
                    className="btn btn-outline-secondary btn-sm w-100"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="col-lg-9">
              <div className="mb-4">
                <h2>
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
                </h2>
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
    <Suspense fallback={<Loading />}><ProductsContent /></Suspense>
  );
}

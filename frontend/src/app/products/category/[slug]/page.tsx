'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import Loading from '@/components/common/Loading';
import api, { endpoints } from '@/lib/api';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default function CategoryProductsPage({ params }: CategoryPageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState('Category');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoints.products.byCategory(params.slug));
        const payload = response.data.data;
        setProducts(payload.products || []);
        setCategoryName(payload.category?.name || params.slug);
      } catch (error) {
        console.error('Failed to fetch category products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [params.slug]);

  return (
    <>
      <Header />

      <main className="py-5">
        <div className="container">
          <div className="mb-4">
            <h2>{categoryName}</h2>
            <p className="text-muted">{products.length} products found</p>
          </div>

          {loading ? (
            <Loading />
          ) : products.length > 0 ? (
            <div className="row g-4">
              {products.map((product: any) => (
                <div key={product.id} className="col-6 col-md-4 col-lg-3">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <h4 className="text-muted">No products found in this category</h4>
              <p>Try exploring other categories.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

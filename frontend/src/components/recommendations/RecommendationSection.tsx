'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';

interface RecommendationProduct {
  product_id: string;
  product_name: string;
  product_slug: string;
  base_price: number;
  discount_price: number | null;
  product_image: string;
  score: number;
  reason: string;
}

interface RecommendationSectionProps {
  title: string;
  endpoint: string;
  limit?: number;
  className?: string;
}

export default function RecommendationSection({
  title,
  endpoint,
  limit = 6,
  className = '',
}: RecommendationSectionProps) {
  const [products, setProducts] = useState<RecommendationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [endpoint]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${endpoint}?limit=${limit}`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={`py-5 ${className}`}>
        <div className="container">
          <h3 className="mb-4">{title}</h3>
          <div className="row">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="col-md-6 col-lg-4 col-xl-2 mb-4">
                <div className="card">
                  <div className="placeholder-glow">
                    <div className="placeholder" style={{ height: '300px' }}></div>
                  </div>
                  <div className="card-body">
                    <div className="placeholder-glow">
                      <span className="placeholder col-12"></span>
                      <span className="placeholder col-8"></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`py-5 ${className}`}>
      <div className="container">
        <h3 className="mb-4">{title}</h3>
        <div className="row">
          {products.map((product) => {
            const price = product.discount_price || product.base_price;
            const discount = product.discount_price
              ? Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)
              : 0;

            return (
              <div key={product.product_id} className="col-md-6 col-lg-4 col-xl-2 mb-4">
                <Link href={`/products/${product.product_slug}`} className="text-decoration-none">
                  <div className="card h-100 product-card">
                    {/* Product Image */}
                    <div className="position-relative" style={{ height: '300px' }}>
                      <Image
                        src={resolveImageUrl(product.product_image)}
                        alt={product.product_name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="card-img-top"
                      />
                      {discount > 0 && (
                        <span
                          className="badge bg-danger position-absolute"
                          style={{ top: '10px', right: '10px' }}
                        >
                          {discount}% OFF
                        </span>
                      )}
                      {product.reason && (
                        <span
                          className="badge position-absolute"
                          style={{
                            bottom: '10px',
                            left: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            fontSize: '0.7rem',
                          }}
                        >
                          {product.reason}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="card-body">
                      <h6 className="card-title text-truncate" title={product.product_name}>
                        {product.product_name}
                      </h6>
                      <div className="d-flex align-items-center gap-2">
                        <span className="h6 mb-0" style={{ color: '#D4A373' }}>
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        {discount > 0 && (
                          <span className="text-muted text-decoration-line-through small">
                            ₹{product.base_price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .product-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </section>
  );
}

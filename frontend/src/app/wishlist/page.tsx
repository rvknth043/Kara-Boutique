'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Loading from '@/components/common/Loading';
import { resolveImageUrl } from '@/lib/image';

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch wishlist');
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await api.delete(`/wishlist/remove/${productId}`);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to remove item');
    }
  };

  const handleMoveToCart = async (item: any) => {
    try {
      // Add to cart
      if (!item.variant_id) {
        toast.error('No purchasable variant available for this product');
        return;
      }

      await addToCart(item.variant_id, 1);

      // Remove from wishlist
      await api.delete(`/wishlist/remove/${item.product_id}`);
      
      toast.success('Moved to cart!');
      fetchWishlist();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to move to cart');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />
      
      <main className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>My Wishlist ({items.length} items)</h2>
            <Link href="/products" className="btn btn-outline-primary">
              Continue Shopping
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <h4 className="text-muted mb-3">Your wishlist is empty</h4>
                <p className="text-muted mb-4">Save your favorite items here!</p>
                <Link href="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {items.map((item) => (
                <div key={item.id} className="col-md-6 col-lg-4">
                  <div className="card h-100">
                    <div className="position-relative">
                      <Link href={`/products/${item.product_slug || item.product_id}`}>
                        <Image
                          src={resolveImageUrl(item.product_image)}
                          alt={item.product_name}
                          width={400}
                          height={500}
                          style={{ objectFit: 'cover', width: '100%' }}
                          className="card-img-top"
                        />
                      </Link>
                      <button
                        onClick={() => handleRemove(item.product_id)}
                        className="btn btn-sm btn-light position-absolute top-0 end-0 m-2"
                        style={{ borderRadius: '50%', width: '36px', height: '36px' }}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="card-body">
                      <Link 
                        href={`/products/${item.product_slug || item.product_id}`}
                        className="text-decoration-none text-dark"
                      >
                        <h6 className="card-title mb-2">{item.product_name}</h6>
                      </Link>
                      
                      <p className="text-muted small mb-2">
                        Size: {item.variant_size} | Color: {item.variant_color}
                      </p>
                      
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <span className="fw-bold" style={{ color: '#D4A373', fontSize: '1.25rem' }}>
                          ₹{item.variant_price.toLocaleString('en-IN')}
                        </span>
                        {item.discount_price && (
                          <span className="text-muted text-decoration-line-through small">
                            ₹{item.base_price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {item.stock_quantity > 0 ? (
                        <div className="d-grid gap-2">
                          <button
                            onClick={() => handleMoveToCart(item)}
                            className="btn btn-primary"
                          >
                            Move to Cart
                          </button>
                        </div>
                      ) : (
                        <div className="alert alert-danger mb-0">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

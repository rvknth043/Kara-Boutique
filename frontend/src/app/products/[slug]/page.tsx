'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Loading from '@/components/common/Loading';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import api, { endpoints } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const productIdentifier = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchProduct();
  }, [productIdentifier]);

  const fetchProduct = async () => {
    try {
      let productData: any = null;

      try {
        const response = await api.get(endpoints.products.getBySlug(productIdentifier));
        productData = response.data.data;
      } catch (slugError) {
        const fallbackResponse = await api.get(endpoints.products.getById(productIdentifier));
        productData = fallbackResponse.data.data;
      }

      setProduct(productData);

      // Select first available variant
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }

      // Fetch reviews
      fetchReviews(productData.id);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId: string) => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      setReviews(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    if (product) {
      fetchReviews(product.id);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    try {
      await addToCart(selectedVariant.id, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  if (loading) return <><Header /><Loading /><Footer /></>;
  if (!product) return <><Header /><div className="container py-5"><h3>Product not found</h3></div><Footer /></>;

  const price = product.discount_price || product.base_price;
  const discount = product.discount_price 
    ? Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)
    : 0;

  const inWishlist = isInWishlist(product.id);

  return (
    <>
      <Header />
      
      <main className="py-5">
        <div className="container">
          <div className="row">
            {/* Product Images */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <Image
                  src={product.images?.[0]?.image_url || '/placeholder.jpg'}
                  alt={product.name}
                  width={600}
                  height={800}
                  className="card-img-top"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              
              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="d-flex gap-2 mt-3">
                  {product.images.slice(0, 4).map((img: any, index: number) => (
                    <div key={index} className="border rounded" style={{ width: '80px', height: '100px', overflow: 'hidden' }}>
                      <Image
                        src={img.image_url}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={100}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="col-lg-6">
              <h1 className="mb-3">{product.name}</h1>
              
              {/* Price */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-3">
                  <h2 className="mb-0" style={{ color: '#D4A373' }}>
                    ₹{price.toLocaleString('en-IN')}
                  </h2>
                  {discount > 0 && (
                    <>
                      <span className="h4 text-muted text-decoration-line-through">
                        ₹{product.base_price.toLocaleString('en-IN')}
                      </span>
                      <span className="badge bg-success">{discount}% OFF</span>
                    </>
                  )}
                </div>
                <small className="text-muted">Inclusive of all taxes</small>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4">
                  <h5>Description</h5>
                  <p className="text-muted">{product.description}</p>
                </div>
              )}

              {/* Size Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-2">Select Size</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {Array.from(new Set(product.variants.map((v: any) => v.size))).map((size: any) => {
                      const variant = product.variants.find((v: any) => v.size === size);
                      const isSelected = selectedVariant?.size === size;
                      const isAvailable = variant && (variant.stock_quantity - variant.reserved_quantity) > 0;

                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && setSelectedVariant(variant)}
                          disabled={!isAvailable}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-primary'} ${!isAvailable ? 'opacity-50' : ''}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-2">Select Color</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {Array.from(new Set(product.variants.map((v: any) => v.color))).map((color: any) => {
                      const variant = product.variants.find((v: any) => v.color === color && v.size === selectedVariant?.size);
                      const isSelected = selectedVariant?.color === color;

                      return variant && (
                        <button
                          key={color}
                          onClick={() => setSelectedVariant(variant)}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-4">
                <h6 className="mb-2">Quantity</h6>
                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn btn-outline-secondary"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="form-control text-center"
                    style={{ width: '80px' }}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="btn btn-outline-secondary"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3 mb-4">
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-lg flex-grow-1"
                  disabled={!selectedVariant}
                >
                  <FiShoppingCart className="me-2" />
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className="btn btn-outline-primary btn-lg"
                >
                  <FiHeart fill={inWishlist ? '#D4A373' : 'none'} />
                </button>
              </div>

              {/* Product Details */}
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Product Details</h6>
                  <table className="table table-sm">
                    <tbody>
                      {product.category_name && (
                        <tr>
                          <td className="text-muted">Category</td>
                          <td>{product.category_name}</td>
                        </tr>
                      )}
                      {selectedVariant && (
                        <tr>
                          <td className="text-muted">SKU</td>
                          <td>{selectedVariant.sku}</td>
                        </tr>
                      )}
                      {selectedVariant && (
                        <tr>
                          <td className="text-muted">Availability</td>
                          <td>
                            {selectedVariant.stock_quantity - selectedVariant.reserved_quantity > 0 ? (
                              <span className="text-success">In Stock</span>
                            ) : (
                              <span className="text-danger">Out of Stock</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Size Chart */}
          {product.size_chart && product.size_chart.length > 0 && (
            <div className="row mt-5">
              <div className="col-12">
                <h4 className="mb-4">Size Chart</h4>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Bust (inches)</th>
                        <th>Waist (inches)</th>
                        <th>Hips (inches)</th>
                        <th>Length (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.size_chart.map((size: any) => (
                        <tr key={size.size}>
                          <td><strong>{size.size}</strong></td>
                          <td>{size.bust}</td>
                          <td>{size.waist}</td>
                          <td>{size.hips}</td>
                          <td>{size.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Customer Reviews</h4>
                {isAuthenticated && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="btn btn-outline-primary"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && isAuthenticated && (
                <div className="mb-4">
                  <ReviewForm
                    productId={product.id}
                    onReviewSubmitted={handleReviewSubmitted}
                  />
                </div>
              )}

              <ReviewList
                reviews={reviews}
                averageRating={product.average_rating}
                totalReviews={product.total_reviews}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

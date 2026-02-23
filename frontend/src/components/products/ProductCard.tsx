'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    discount_price?: number;
    images?: Array<{ image_url: string }>;
    variants?: Array<{ id: string; size: string; color: string }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const price = product.discount_price || product.base_price;
  const discount = product.discount_price 
    ? Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)
    : 0;

  const imageUrl = product.images?.[0]?.image_url || '/placeholder.jpg';
  const productPath = `/products/${product.slug || product.id}`;
  const inWishlist = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Add first available variant
    if (product.variants && product.variants.length > 0) {
      addToCart(product.variants[0].id, 1);
    }
  };

  return (
    <div className="product-card card h-100">
      <Link href={productPath} className="position-relative">
        <Image
          src={imageUrl}
          alt={product.name}
          width={300}
          height={400}
          className="card-img-top"
          style={{ objectFit: 'cover' }}
        />
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle"
          style={{ width: '40px', height: '40px', padding: '0' }}
        >
          <FiHeart 
            size={20} 
            fill={inWishlist ? '#D4A373' : 'none'}
            color={inWishlist ? '#D4A373' : '#000'}
          />
        </button>

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="badge bg-danger position-absolute top-0 start-0 m-2">
            {discount}% OFF
          </span>
        )}
      </Link>

      <div className="card-body d-flex flex-column">
        <Link href={productPath} className="text-decoration-none text-dark">
          <h6 className="card-title mb-2">{product.name}</h6>
        </Link>

        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="h5 mb-0" style={{ color: '#D4A373' }}>
            ₹{price.toLocaleString('en-IN')}
          </span>
          {discount > 0 && (
            <span className="text-muted text-decoration-line-through small">
              ₹{product.base_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="btn btn-primary btn-sm mt-auto"
        >
          <FiShoppingCart className="me-2" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

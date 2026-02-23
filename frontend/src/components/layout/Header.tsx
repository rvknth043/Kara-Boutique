'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { endpoints } from '@/lib/api';

interface CategoryNavItem {
  id: string;
  name: string;
  slug: string;
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryNavItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get(endpoints.categories.getAll);
        const categoryData = Array.isArray(response.data.data) ? response.data.data : [];
        setCategories(categoryData.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch categories for navigation:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header>
      {/* Top Bar */}
      <div className="bg-dark text-white py-2">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <small>Free shipping on orders above ₹1,499</small>
            </div>
            <div className="col-md-6 text-md-end">
              <small>Customer Care: +91 9876543210</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold fs-3" style={{ color: '#D4A373' }}>
            Kara Boutique
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <FiMenu />
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Search Bar */}
            <form className="d-flex mx-auto my-2 my-lg-0" onSubmit={handleSearch} style={{ maxWidth: '400px', width: '100%' }}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-outline-primary" type="submit">
                  <FiSearch />
                </button>
              </div>
            </form>

            {/* Right Side Icons */}
            <div className="d-flex align-items-center gap-3 ms-lg-3">
              <Link href="/wishlist" className="text-dark position-relative">
                <FiHeart size={24} />
                {wishlistCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="text-dark position-relative">
                <FiShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn btn-link text-dark p-0"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                  >
                    <FiUser size={24} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li className="px-3 py-2">
                      <small className="text-muted">Hi, {user?.full_name}</small>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link href="/account" className="dropdown-item">My Account</Link>
                    </li>
                    <li>
                      <Link href="/orders" className="dropdown-item">My Orders</Link>
                    </li>
                    <li>
                      <Link href="/wishlist" className="dropdown-item">Wishlist</Link>
                    </li>
                    {user?.role === 'admin' && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link href="/admin" className="dropdown-item">Admin Dashboard</Link>
                        </li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button onClick={logout} className="dropdown-item">Logout</button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link href="/login" className="btn btn-primary btn-sm">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Category Navigation */}
      <div className="bg-light py-2">
        <div className="container">
          <nav className="d-flex justify-content-center gap-4 flex-wrap">
            <Link href="/products" className="text-dark text-decoration-none">All Products</Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products/category/${encodeURIComponent(category.slug)}`}
                className="text-dark text-decoration-none"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiShoppingBag, 
  FiPackage, 
  FiUsers, 
  FiBarChart2,
  FiRepeat,
  FiTag,
  FiLogOut
} from 'react-icons/fi';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: FiHome },
    { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
    { href: '/admin/products', label: 'Products', icon: FiPackage },
    { href: '/admin/customers', label: 'Customers', icon: FiUsers },
    { href: '/admin/exchanges', label: 'Exchanges', icon: FiRepeat },
    { href: '/admin/coupons', label: 'Coupons', icon: FiTag },
    { href: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  ];

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div 
        className="bg-dark text-white d-flex flex-column"
        style={{ width: '250px', minHeight: '100vh' }}
      >
        {/* Logo */}
        <div className="p-4 border-bottom border-secondary">
          <h4 className="mb-0" style={{ color: '#D4A373' }}>Kara Boutique</h4>
          <small className="text-muted">Admin Panel</small>
        </div>

        {/* User Info */}
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                 style={{ width: '40px', height: '40px' }}>
              <span className="fw-bold">{user?.full_name?.charAt(0)}</span>
            </div>
            <div className="ms-2">
              <small className="d-block">{user?.full_name}</small>
              <small className="text-muted">{user?.role}</small>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`d-flex align-items-center px-4 py-3 text-decoration-none ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-white-50 hover-bg-secondary'
                }`}
                style={{ 
                  borderLeft: isActive ? '4px solid #D4A373' : '4px solid transparent',
                  transition: 'all 0.3s'
                }}
              >
                <Icon size={20} className="me-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-top border-secondary">
          <Link
            href="/"
            className="d-flex align-items-center text-white-50 text-decoration-none mb-2"
          >
            <FiHome size={20} className="me-3" />
            <span>Back to Store</span>
          </Link>
          
          <button
            onClick={logout}
            className="d-flex align-items-center btn btn-link text-white-50 text-decoration-none p-0 w-100"
          >
            <FiLogOut size={20} className="me-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto bg-light">
        {children}
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.scss';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Kara Boutique - Ethnic & Contemporary Fashion',
  description: 'Shop the latest ethnic and contemporary fashion at Kara Boutique',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3200,
                  style: {
                    background: '#ffffff',
                    color: '#1f2937',
                    border: '1px solid #e6d5c3',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function TrackOrderPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Track Your Order</h1>
          <p className="text-muted">Login to view order tracking updates.</p>
          <Link href="/orders" className="btn btn-primary">Go to My Orders</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

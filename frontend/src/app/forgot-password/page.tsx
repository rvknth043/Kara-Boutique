import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container" style={{ maxWidth: '640px' }}>
          <h1>Forgot Password</h1>
          <p className="text-muted">Password reset flow is coming soon. Please contact support for immediate help.</p>
          <Link href="/contact" className="btn btn-primary">Contact Support</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p className="text-muted">You can browse products, place orders, and manage returns from your account dashboard.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

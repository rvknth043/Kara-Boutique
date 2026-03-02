import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function SizeGuidePage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Size Guide</h1>
          <p className="text-muted">Refer to product-specific size charts on each product details page for accurate fitting.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

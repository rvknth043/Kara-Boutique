import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Shipping Policy</h1>
          <p className="text-muted">Standard delivery timelines are 3-7 business days depending on location.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

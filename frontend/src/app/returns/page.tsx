import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Returns & Exchanges</h1>
          <p className="text-muted">Items can be returned/exchanged within 7 days if eligible under policy.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

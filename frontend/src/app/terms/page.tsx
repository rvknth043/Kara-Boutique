import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Terms & Conditions</h1>
          <p className="text-muted">By using Kara Boutique, you agree to our ordering, payment, and return terms.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="text-muted">We use your data only for order processing, account management, and service communication.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

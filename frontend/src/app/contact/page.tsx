import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>Contact Us</h1>
          <p className="text-muted">Customer Care: +91 9876543210</p>
          <p className="text-muted">Email: support@karaboutique.com</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

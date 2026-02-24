import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <h1>About Kara Boutique</h1>
          <p className="text-muted">Kara Boutique offers curated ethnic and contemporary fashion collections for daily wear and special occasions.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

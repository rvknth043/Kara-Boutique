import Link from 'next/link';

export default function AdminInventoryPage() {
  return (
    <main className="py-4">
      <div className="container">
        <h1 className="mb-3">Inventory</h1>
        <p className="text-muted">Inventory management is available from the products and variants modules.</p>
        <Link href="/admin/products" className="btn btn-primary">Go to Products</Link>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-5 mt-5">
      <div className="container">
        <div className="row">
          {/* About */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3" style={{ color: '#D4A373' }}>Kara Boutique</h5>
            <p className="small">
              Your destination for ethnic and contemporary fashion. 
              Quality products, affordable prices, and exceptional service.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="#" className="text-white"><FiFacebook size={20} /></a>
              <a href="#" className="text-white"><FiInstagram size={20} /></a>
              <a href="#" className="text-white"><FiTwitter size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-3 mb-4">
            <h6 className="mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link href="/products" className="text-white-50 text-decoration-none">
                  Shop All
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/about" className="text-white-50 text-decoration-none">
                  About Us
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/contact" className="text-white-50 text-decoration-none">
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/track-order" className="text-white-50 text-decoration-none">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-md-3 mb-4">
            <h6 className="mb-3">Customer Service</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link href="/shipping" className="text-white-50 text-decoration-none">
                  Shipping Policy
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/returns" className="text-white-50 text-decoration-none">
                  Returns & Exchanges
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/faq" className="text-white-50 text-decoration-none">
                  FAQ
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/size-guide" className="text-white-50 text-decoration-none">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-md-3 mb-4">
            <h6 className="mb-3">Contact Us</h6>
            <p className="small mb-2">
              <strong>Email:</strong><br />
              support@karaboutique.com
            </p>
            <p className="small mb-2">
              <strong>Phone:</strong><br />
              +91 9876543210
            </p>
            <p className="small mb-2">
              <strong>Hours:</strong><br />
              Mon-Sat: 10am - 7pm
            </p>
          </div>
        </div>

        <hr className="my-4 bg-white opacity-25" />

        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <p className="small mb-0">
              © 2026 Kara Boutique. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <Link href="/privacy" className="text-white-50 text-decoration-none small me-3">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white-50 text-decoration-none small">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

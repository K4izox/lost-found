import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import puLogo from '@/assets/president-university-logo.png';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
                <img src={puLogo} alt="President University Logo" className="h-9 w-9 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">Lost & Found</span>
                <span className="text-xs text-primary-foreground/70">President University</span>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Helping the President University community recover lost items and reunite them with their owners.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/browse" className="hover:text-primary-foreground transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-primary-foreground transition-colors">
                  Report Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-primary-foreground transition-colors">
                  Report Found Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary-foreground transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <Link to="/faq" className="hover:text-primary-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-primary-foreground transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Jababeka Education Park, Cikarang</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:lostandfound@president.ac.id" className="hover:text-primary-foreground transition-colors">
                  lostandfound@president.ac.id
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+62 21 8910 9762</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} President University. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/60">
            Made with ❤️ for the PU Community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

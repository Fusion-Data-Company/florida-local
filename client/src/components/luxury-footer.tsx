import { Link } from "wouter";

export default function LuxuryFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 glass-panel border-t border-border/20 backdrop-blur-lg">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      
      <div className="container mx-auto px-4 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <i className="fas fa-palm-tree text-3xl neon-cyan neon-glow"></i>
                <div className="absolute inset-0 neon-cyan opacity-20 blur-lg"></div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold metallic gradient-text-gold text-luxury font-serif">
                  Florida Local
                </h2>
                <p className="text-xs gradient-text-cyan font-medium tracking-wider uppercase">
                  Elite
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Connecting Florida's finest businesses with discerning customers who appreciate luxury, 
              quality, and exceptional service.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-facebook"
              >
                <i className="fab fa-facebook-f text-lg group-hover:text-primary transition-colors duration-300"></i>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-instagram"
              >
                <i className="fab fa-instagram text-lg group-hover:text-accent transition-colors duration-300"></i>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-twitter"
              >
                <i className="fab fa-twitter text-lg group-hover:text-primary transition-colors duration-300"></i>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-linkedin"
              >
                <i className="fab fa-linkedin-in text-lg group-hover:text-secondary transition-colors duration-300"></i>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </div>
          </div>

          {/* Business Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold gradient-text-gold text-luxury mb-6">
              For Businesses
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/create-business" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-create-business">
                  <span className="relative z-10">Create Business</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/vendor/products" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-manage-products">
                  <span className="relative z-10">Manage Products</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/spotlight" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-spotlight">
                  <span className="relative z-10">Spotlight Program</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <a href="#advertising" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-advertising">
                  <span className="relative z-10">Advertising</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#analytics" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-analytics">
                  <span className="relative z-10">Business Analytics</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold gradient-text-cyan text-luxury mb-6">
              For Customers
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-discover">
                  <span className="relative z-10">Discover</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-marketplace">
                  <span className="relative z-10">Marketplace</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/messages" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-network">
                  <span className="relative z-10">Network</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/orders" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-orders">
                  <span className="relative z-10">My Orders</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <a href="#rewards" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-rewards">
                  <span className="relative z-10">Loyalty Rewards</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold gradient-text-magenta text-luxury mb-6">
              Legal & Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-privacy">
                  <span className="relative z-10">Privacy Policy</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#terms" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-terms">
                  <span className="relative z-10">Terms of Service</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#support" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-support">
                  <span className="relative z-10">Customer Support</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#contact" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-contact">
                  <span className="relative z-10">Contact Us</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#accessibility" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-accessibility">
                  <span className="relative z-10">Accessibility</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mb-12 p-8 glass-panel rounded-2xl card-rim-light">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold gradient-text text-luxury font-serif mb-4">
              Stay Connected with Florida's Elite
            </h3>
            <p className="text-muted-foreground mb-6">
              Get exclusive access to premium businesses, special offers, and insider updates from Florida's luxury marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg glass-panel border-border/30 bg-background/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 text-foreground placeholder:text-muted-foreground"
                data-testid="newsletter-email"
              />
              <button
                className="px-6 py-3 metallic hover-lift btn-press glow-secondary rounded-lg font-semibold transition-all duration-300"
                data-testid="newsletter-subscribe"
              >
                <span className="relative z-10">Subscribe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <p className="text-luxury">
                © {currentYear} Florida Local Elite. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground/70">Made with</span>
                <i className="fas fa-heart text-accent animate-pulse"></i>
                <span className="text-xs text-muted-foreground/70">in Miami</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#security" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-security">
                <i className="fas fa-shield-alt mr-2 group-hover:text-secondary transition-colors duration-300"></i>
                <span className="relative z-10">Secure</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
              </a>
              <a href="#certified" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-certified">
                <i className="fas fa-certificate mr-2 group-hover:text-primary transition-colors duration-300"></i>
                <span className="relative z-10">Certified</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
              </a>
              <a href="#verified" className="group relative text-muted-foreground hover:text-foreground transition-all duration-300" data-testid="footer-verified">
                <i className="fas fa-check-circle mr-2 group-hover:text-accent transition-colors duration-300"></i>
                <span className="relative z-10">Verified</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 ambient-particles opacity-30 pointer-events-none"></div>
    </footer>
  );
}
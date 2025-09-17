import NavigationHeader from "@/components/navigation-header";
import HeroSection from "@/components/hero-section";
import SpotlightShowcase from "@/components/spotlight-showcase";
import MarketplaceSection from "@/components/marketplace-section";
import SocialFeed from "@/components/social-feed";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <HeroSection />
      <SpotlightShowcase />
      
      {/* Profile Creation CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Shine in the Spotlight?
            </h2>
            
            <p className="text-xl mb-12 opacity-90 leading-relaxed">
              Join thousands of Florida businesses building their digital presence, 
              connecting with customers, and growing their community impact.
            </p>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="glass-effect p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-store text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Rich Business Profiles</h3>
                <p className="opacity-90">Showcase your brand with high-quality images, videos, and detailed descriptions.</p>
              </div>
              
              <div className="glass-effect p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shopping-cart text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">E-Commerce Integration</h3>
                <p className="opacity-90">Sell products directly through your profile with built-in payment processing.</p>
              </div>
              
              <div className="glass-effect p-6 rounded-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Community Network</h3>
                <p className="opacity-90">Connect with other businesses, collaborate, and build lasting partnerships.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/api/login'} 
                className="bg-white text-primary hover:bg-white/90 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                data-testid="button-create-profile"
              >
                Create Your Business Profile
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105">
                See Pricing Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceSection />
      <SocialFeed />

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="grid lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <i className="fas fa-palm-tree text-2xl text-primary"></i>
                <div>
                  <h1 className="text-xl font-bold gradient-text">Florida Local</h1>
                  <p className="text-xs text-muted-foreground">Elite</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Connecting Florida's business community through innovation, collaboration, and local pride. 
                Where entrepreneurs thrive together.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-all">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-all">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-all">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-all">
                  <i className="fab fa-twitter"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-6">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Business Profiles</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Marketplace</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Community</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Spotlight</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Analytics</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-lg mb-6">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Getting Started</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Success Stories</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-bold text-lg mb-6">Stay Connected</h3>
              <p className="text-muted-foreground mb-4">
                Get the latest updates on new features, spotlight businesses, and community events.
              </p>
              <div className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="input-newsletter-email"
                />
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-all"
                  data-testid="button-subscribe-newsletter"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-muted-foreground text-sm mb-4 md:mb-0">
                © 2024 Florida Local Elite. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
}

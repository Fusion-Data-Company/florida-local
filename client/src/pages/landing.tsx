import EliteNavigationHeader from "@/components/elite-navigation-header";
import HeroSection from "@/components/hero-section";
import SpotlightShowcase from "@/components/spotlight-showcase";
import MarketplaceSection from "@/components/marketplace-section";
import SocialFeed from "@/components/social-feed";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Store, ShoppingCart, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <EliteNavigationHeader />
      <HeroSection />
      <SpotlightShowcase />
      
      {/* Miami Elite Profile Creation CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary miami-cta-section">
        <div className="container mx-auto px-4 lg:px-8 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 miami-heading">
              Ready to Shine in the Spotlight?
            </h2>
            
            <p className="text-xl mb-12 opacity-90 leading-relaxed miami-body-text">
              Join thousands of Florida businesses building their digital presence, 
              connecting with customers, and growing their community impact.
            </p>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover-lift card-rim-light group transition-all duration-500 shadow-luxury-multi">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-elevated">
                  <Store className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Rich Business Profiles</h3>
                <p className="text-white/90 leading-relaxed">Showcase your brand with high-quality images, videos, and detailed descriptions that captivate your audience.</p>
              </div>
              
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover-lift card-rim-light group transition-all duration-500 shadow-luxury-multi">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-elevated">
                  <ShoppingCart className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">E-Commerce Integration</h3>
                <p className="text-white/90 leading-relaxed">Sell products directly through your profile with secure built-in payment processing and inventory management.</p>
              </div>
              
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover-lift card-rim-light group transition-all duration-500 shadow-luxury-multi">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-elevated">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Community Network</h3>
                <p className="text-white/90 leading-relaxed">Connect with other businesses, collaborate on projects, and build lasting partnerships that grow your network.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/api/login'} 
                className="btn-miami-glass text-primary miami-hover-lift px-8 py-4 rounded-lg text-lg font-semibold"
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
                  <h1 className="text-xl font-bold gradient-text">The Florida Local</h1>
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
                © 2024 The Florida Local. All rights reserved.
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

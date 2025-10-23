import HeroSection from "@/components/hero-section";
import SpotlightShowcase from "@/components/spotlight-showcase";
import MarketplaceSection from "@/components/marketplace-section";
import SocialFeed from "@/components/social-feed";
import { Button } from "@/components/ui/button";
import { StardustButton } from "@/components/ui/stardust-button";
import VideoBackground from "@/components/video-background";
import {
  AnimatedGradientHero,
  ParticleField,
  AuroraAmbient,
  HoverTrail
} from "@/components/premium-ultra";
import GlowHero from "@/components/ui/glow-hero";
import { Store, ShoppingCart, Users, Sparkles, TrendingUp, Building2, Palmtree, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background - Behind all content */}
      <VideoBackground 
        randomize={true}  // Randomly select from the 4 available videos
        overlayOpacity={0.3}  // Slight overlay for better text readability
      />
      
      {/* CONTENT WRAPPER - Proper Z-Index */}
      <div className="relative z-10">
      <HeroSection />
      <SpotlightShowcase />
      
      {/* Miami Elite Profile Creation CTA */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Gradient Background */}
        <AnimatedGradientHero>
          <ParticleField count={60} color="cyan" />

          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20" />

          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <GlowHero
              glowText="Ready to Shine in the Spotlight?"
              glowTextSize="lg"
              className="mb-6 entrance-fade-up"
            />

            <div className="bg-black/60 backdrop-blur-sm p-6 rounded-2xl mb-12 entrance-fade-up stagger-1">
              <p className="text-xl text-white leading-relaxed" style={{textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>
                Join thousands of Florida businesses building their digital presence,
                connecting with customers, and growing their community impact.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12 entrance-fade-up stagger-2">
              <div className="relative group">
                {/* Glowing background effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative bg-white border border-border/50 p-8 rounded-2xl hover-lift shadow-luxury-multi transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-primary/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border-2 border-orange-400/30" style={{boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'}}>
                    <Store className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Rich Business Profiles</h3>
                  <p className="text-gray-900 leading-relaxed">Showcase your brand with high-quality images, videos, and detailed descriptions that captivate your audience.</p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-secondary/40 via-secondary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative bg-white border border-border/50 p-8 rounded-2xl hover-lift shadow-luxury-multi transition-all duration-500 group-hover:border-secondary/30 group-hover:shadow-secondary/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border-2 border-teal-400/30" style={{boxShadow: '0 8px 20px rgba(20, 184, 166, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'}}>
                    <ShoppingCart className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">E-Commerce Integration</h3>
                  <p className="text-gray-900 leading-relaxed">Sell products directly through your profile with secure built-in payment processing and inventory management.</p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-accent/40 via-accent/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative bg-white border border-border/50 p-8 rounded-2xl hover-lift shadow-luxury-multi transition-all duration-500 group-hover:border-accent/30 group-hover:shadow-accent/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border-2 border-purple-400/30" style={{boxShadow: '0 8px 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'}}>
                    <Users className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Community Network</h3>
                  <p className="text-gray-900 leading-relaxed">Connect with other businesses, collaborate on projects, and build lasting partnerships that grow your network.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center entrance-scale-fade stagger-3">
              <StardustButton
                variant="gold"
                size="lg"
                onClick={() => {
                  try {
                    window.location.href = '/api/login';
                  } catch (error) {
                    console.error('❌ Login button error:', error);
                    alert('Failed to initiate login. Please refresh the page and try again.');
                  }
                }}
                data-testid="button-create-profile"
                className="shimmer-gold-hover"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your Business Profile
              </StardustButton>
              <StardustButton
                variant="teal"
                size="lg"
                onClick={() => {
                  window.location.href = '/api/login';
                }}
                data-testid="button-create-profile-alt"
                className="shimmer-on-hover"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Sign In
              </StardustButton>
              <StardustButton
                variant="teal"
                size="lg"
                className="shimmer-on-hover"
              >
                See Pricing Plans
              </StardustButton>
            </div>
          </div>
          </div>
        </AnimatedGradientHero>
      </section>

      <MarketplaceSection />
      <SocialFeed />

      {/* Footer */}
      <footer className="relative bg-card/95 backdrop-blur-xl border-t border-border/50 premium-surface overflow-hidden" data-surface-intensity="delicate">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>

        <div className="container mx-auto px-4 lg:px-8 py-16 relative z-10">
          <div className="grid lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-1 entrance-fade-up">
              <div className="flex items-center space-x-2 mb-6 group">
                <i className="fas fa-palm-tree text-2xl text-primary group-hover:scale-110 transition-transform duration-300"></i>
                <div>
                  <h1 className="text-xl font-bold text-primary">Florida Local</h1>
                  <p className="text-xs text-gray-700">Elite</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Connecting Florida's business community through innovation, collaboration, and local pride.
                Where entrepreneurs thrive together.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-md hover:shadow-primary/40 group">
                  <i className="fab fa-facebook relative z-10"></i>
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="#" className="relative w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-md hover:shadow-secondary/40 group">
                  <i className="fab fa-instagram relative z-10"></i>
                  <div className="absolute inset-0 bg-secondary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="#" className="relative w-10 h-10 bg-gradient-to-br from-accent to-accent/80 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-md hover:shadow-accent/40 group">
                  <i className="fab fa-linkedin relative z-10"></i>
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="#" className="relative w-10 h-10 bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-md hover:shadow-primary/40 group">
                  <i className="fab fa-twitter relative z-10"></i>
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="entrance-fade-up stagger-1">
              <h3 className="font-bold text-lg mb-6 text-primary">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Business Profiles</a></li>
                <li><a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Marketplace</a></li>
                <li><a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Community</a></li>
                <li><a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Spotlight</a></li>
                <li><a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Analytics</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="entrance-fade-up stagger-2">
              <h3 className="font-bold text-lg mb-6 text-secondary">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-700 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block">Help Center</a></li>
                <li><a href="#" className="text-gray-700 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block">Getting Started</a></li>
                <li><a href="#" className="text-gray-700 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block">API Documentation</a></li>
                <li><a href="#" className="text-gray-700 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block">Success Stories</a></li>
                <li><a href="#" className="text-gray-700 hover:text-secondary transition-all duration-300 hover:translate-x-1 inline-block">Blog</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="entrance-fade-up stagger-3">
              <h3 className="font-bold text-lg mb-6 text-accent">Stay Connected</h3>
              <p className="text-gray-700 mb-4">
                Get the latest updates on new features, spotlight businesses, and community events.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 hover:border-border backdrop-blur-sm"
                  data-testid="input-newsletter-email"
                />
                <button
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
                  data-testid="button-subscribe-newsletter"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/30">
            <div className="flex flex-col md:flex-row items-center justify-between entrance-fade-up stagger-4">
              <p className="text-gray-700 text-sm mb-4 md:mb-0">
                © 2024 Florida Local Elite. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:-translate-y-0.5 inline-block">Privacy Policy</a>
                <a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:-translate-y-0.5 inline-block">Terms of Service</a>
                <a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:-translate-y-0.5 inline-block">Cookie Policy</a>
                <a href="#" className="text-gray-700 hover:text-primary transition-all duration-300 hover:-translate-y-0.5 inline-block">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}

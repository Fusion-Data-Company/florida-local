import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TreePine, Sun, ChevronDown, Search, Sparkles, MapPin, Zap, Users, TrendingUp, Star, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import AISearchBadge from "@/components/ai-search-badge";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [activeUsers, setActiveUsers] = useState(127);
  const [totalBusinesses, setTotalBusinesses] = useState(2847);
  const [totalTransactions, setTotalTransactions] = useState(18392);
  const [showStats, setShowStats] = useState(true);

  // Simulate real-time active user count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 10) - 5; // Random change between -5 and +5
        const newCount = prev + change;
        return Math.max(50, Math.min(300, newCount)); // Keep between 50-300
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchQuery || selectedCity) {
      // TODO: Implement search navigation
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden miami-hero-section">
      {/* Hero Background - Transparent gradient overlay to show YouTube videos from parent pages */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'linear-gradient(135deg, rgba(25,182,246,0.08) 0%, rgba(255,255,255,0.12) 25%, rgba(250,245,220,0.10) 50%, rgba(255,152,67,0.08) 75%, rgba(255,255,255,0.12) 100%)'
        }}
      ></div>
      
      {/* Miami Luxury Depth Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-cyan-900/5 to-teal-900/10" />
      <div className="absolute inset-0 miami-mesh-overlay opacity-10" />

      {/* Miami Luxury Floating Elements */}
      <div className="absolute top-20 right-10 miami-float float-gentle group premium-pop stagger-1">
        <TreePine className="text-4xl text-cyan-400 group-hover:text-cyan-300 transition-colors duration-500 drop-shadow-lg" size={40} />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl"></div>
      </div>
      <div className="absolute bottom-20 left-10 miami-float float-medium group premium-pop stagger-2" style={{ animationDelay: '2s' }}>
        <Sun className="text-3xl text-orange-400 group-hover:text-orange-300 transition-colors duration-500 drop-shadow-lg" size={32} />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl"></div>
      </div>
      <div className="absolute top-1/3 left-20 miami-float float-dynamic group premium-pop stagger-3" style={{ animationDelay: '4s' }}>
        <Sparkles className="text-2xl text-pink-400 group-hover:text-pink-300 transition-colors duration-500 drop-shadow-lg" size={24} />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center text-slate-900 max-w-4xl mx-auto px-4">
        {/* AI-Powered & Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-3 mb-6"
        >
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Platform
          </Badge>
          <motion.div
            className="inline-flex items-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Users className="w-4 h-4 mr-2" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeUsers}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeUsers} Active Now
                </motion.span>
              </AnimatePresence>
            </Badge>
          </motion.div>
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
            <Shield className="w-4 h-4 mr-2" />
            Verified Businesses
          </Badge>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight miami-heading entrance-fade-up bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl inline-block">
          <span className="text-gray-900">Life's </span><span className="miami-gradient-text">BETTER</span><span className="text-gray-900"> when you're</span><br />
          <span className="text-gray-900">Living Like a </span><span className="miami-accent-text">LOCAL</span>
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-gray-900 max-w-2xl mx-auto leading-relaxed miami-body-text entrance-fade-up stagger-1 bg-white/85 backdrop-blur-sm px-6 py-4 rounded-xl font-medium">
          Discover, connect, and thrive with Florida's most vibrant business community.
          Where local entrepreneurs build lasting relationships and grow together.
        </p>

        {/* Platform Statistics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mb-12"
        >
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-gray-900">{totalBusinesses.toLocaleString()}</span>
            <span className="text-sm font-semibold text-gray-900">Businesses</span>
          </div>
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="font-bold text-gray-900">{totalTransactions.toLocaleString()}</span>
            <span className="text-sm font-semibold text-gray-900">Transactions</span>
          </div>
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-bold text-gray-900">AI-Enhanced</span>
            <span className="text-sm font-semibold text-gray-900">Search & Insights</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button
            variant="fl-gold"
            size="xl"
            className="miami-hover-lift ambient-glow-gold shimmer-gold-hover entrance-scale-fade stagger-2"
            onClick={(e) => {
              try {
                window.location.href = '/api/login';
              } catch (error) {
                console.error('❌ Hero login button error:', error);
                alert('Failed to initiate login. Please refresh the page and try again.');
              }
            }}
            data-testid="button-join-community"
          >
            Join the Community
          </Button>
          <Button
            variant="fl-glass"
            size="xl"
            className="miami-hover-lift ambient-glow-teal shimmer-on-hover entrance-scale-fade stagger-3"
            data-testid="button-explore-businesses"
          >
            Explore Businesses
          </Button>
        </div>

        {/* Quick Search */}
        <div className="max-w-3xl mx-auto premium-search-hero entrance-fade-up stagger-4">
          <div className="miami-glass rounded-2xl p-8 miami-card-glow ambient-glow-cyan elevation-3 mouse-track-glow dynamic-gradient-bg">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600 group-hover:text-primary transition-colors duration-300" />
                <Input 
                  type="search" 
                  placeholder="What type of business are you looking for?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 premium-search-input-hero text-slate-900 placeholder-slate-700 font-medium focus:placeholder-primary/60 transition-all duration-300 bg-white"
                  data-testid="input-search-businesses"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <div className="flex-1 relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600 group-hover:text-secondary transition-colors duration-300" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full pl-12 pr-4 py-4 premium-search-input-hero text-slate-900 border-slate-300 hover:border-slate-400 focus:border-primary/60 transition-all duration-300" data-testid="select-city">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent className="premium-dropdown">
                    <SelectItem value="miami">🏖️ Miami</SelectItem>
                    <SelectItem value="orlando">🎢 Orlando</SelectItem>
                    <SelectItem value="tampa">⚡ Tampa</SelectItem>
                    <SelectItem value="jacksonville">🌊 Jacksonville</SelectItem>
                    <SelectItem value="fort-lauderdale">⛵ Fort Lauderdale</SelectItem>
                    <SelectItem value="tallahassee">🏛️ Tallahassee</SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <Button 
                variant="default"
                size="lg"
                className="px-8 py-4 metallic hover-lift btn-press group font-semibold"
                onClick={handleSearch}
                data-testid="button-search-hero"
              >
                <Search className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Search</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
              </Button>
            </div>
            
            {/* AI Search Badge */}
            <div className="flex justify-center mt-4">
              <AISearchBadge variant="inline" />
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {['Restaurants', 'Wellness', 'Beauty', 'Shopping', 'Events'].map((category, index) => (
                <button
                  key={category}
                  className={`px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-slate-300 text-slate-900 hover:text-slate-900 text-sm font-semibold rounded-full hover-lift transition-all duration-300 group shadow-md hover:shadow-lg ${
                    ['ambient-glow-orange', 'ambient-glow-teal', 'ambient-glow-pink', 'ambient-glow-purple', 'ambient-glow-gold'][index]
                  }`}
                >
                  <span className="relative z-10">{category}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce group cursor-pointer bg-white/80 backdrop-blur-sm rounded-full p-2">
        <ChevronDown className="text-slate-900 group-hover:text-primary text-2xl transition-colors duration-300" size={24} />
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
      </div>
    </section>
  );
}

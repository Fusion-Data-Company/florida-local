import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TreePine, Sun, ChevronDown, Search, Sparkles, MapPin } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  const handleSearch = () => {
    if (searchQuery || selectedCity) {
      // TODO: Implement search navigation
      console.log('Searching:', { query: searchQuery, city: selectedCity });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed" 
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,248,235,0.9) 25%, rgba(250,245,220,0.85) 50%, rgba(255,252,240,0.9) 75%, rgba(255,255,255,0.85) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80')`
        }}
      ></div>

      {/* Floating elements */}
      <div className="absolute top-20 right-10 floating-animation group">
        <TreePine className="text-4xl text-slate-400 group-hover:text-primary transition-colors duration-500" size={40} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
      </div>
      <div className="absolute bottom-20 left-10 floating-animation group" style={{ animationDelay: '1s' }}>
        <Sun className="text-3xl text-slate-500 group-hover:text-secondary transition-colors duration-500" size={32} />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
      </div>
      <div className="absolute top-1/3 left-20 floating-animation group" style={{ animationDelay: '2s' }}>
        <Sparkles className="text-2xl text-slate-400 group-hover:text-accent transition-colors duration-500" size={24} />
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center text-slate-900 max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight text-slate-900">
          Life's <span className="gradient-text">BETTER</span> when you're<br />
          Living Like a <span className="text-secondary">LOCAL</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 text-slate-700 max-w-2xl mx-auto leading-relaxed">
          Discover, connect, and thrive with Florida's most vibrant business community. 
          Where local entrepreneurs build lasting relationships and grow together.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            variant="premium"
            size="xl"
            className="btn-press"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-join-community"
          >
            Join the Community
          </Button>
          <Button 
            variant="glass"
            size="xl"
            className="btn-press"
            data-testid="button-explore-businesses"
          >
            Explore Businesses
          </Button>
        </div>

        {/* Quick Search */}
        <div className="max-w-3xl mx-auto premium-search-hero">
          <div className="glass-panel rounded-2xl p-8 card-rim-light">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600 group-hover:text-primary transition-colors duration-300" />
                <Input 
                  type="search" 
                  placeholder="What type of business are you looking for?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 premium-search-input-hero text-slate-900 placeholder-slate-500 focus:placeholder-primary/60 transition-all duration-300"
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
            
            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {['Restaurants', 'Wellness', 'Beauty', 'Shopping', 'Events'].map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 glass-panel border-slate-300 text-slate-700 hover:text-slate-900 text-sm rounded-full hover-lift transition-all duration-300 group"
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce group cursor-pointer">
        <ChevronDown className="text-slate-700 group-hover:text-primary text-2xl transition-colors duration-300" size={24} />
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
      </div>
    </section>
  );
}

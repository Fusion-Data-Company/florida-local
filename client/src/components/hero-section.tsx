import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80')`
        }}
      ></div>

      {/* Floating elements */}
      <div className="absolute top-20 right-10 floating-animation">
        <i className="fas fa-palm-tree text-4xl text-white opacity-30"></i>
      </div>
      <div className="absolute bottom-20 left-10 floating-animation" style={{ animationDelay: '1s' }}>
        <i className="fas fa-sun text-3xl text-yellow-400 opacity-40"></i>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
          Life's <span className="gradient-text">BETTER</span> when you're<br />
          Living Like a <span className="text-secondary">LOCAL</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed">
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
        <div className="max-w-2xl mx-auto glass-effect rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input 
                type="search" 
                placeholder="What type of business are you looking for?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                data-testid="input-search-businesses"
              />
            </div>
            <div className="flex-1">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50" data-testid="select-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miami">Miami</SelectItem>
                  <SelectItem value="orlando">Orlando</SelectItem>
                  <SelectItem value="tampa">Tampa</SelectItem>
                  <SelectItem value="jacksonville">Jacksonville</SelectItem>
                  <SelectItem value="fort-lauderdale">Fort Lauderdale</SelectItem>
                  <SelectItem value="tallahassee">Tallahassee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="lux"
              size="lg"
              className="btn-press"
              onClick={handleSearch}
              data-testid="button-search-hero"
            >
              <i className="fas fa-search mr-2"></i>Search
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <i className="fas fa-chevron-down text-white text-2xl opacity-70"></i>
      </div>
    </section>
  );
}

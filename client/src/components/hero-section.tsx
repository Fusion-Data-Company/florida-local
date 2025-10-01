import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Search, Sparkles, MapPin } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  const handleSearch = () => {
    if (searchQuery || selectedCity) {
      console.log('Searching:', { query: searchQuery, city: selectedCity });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dramatic Calacatta Gold Marble Background - 60%+ Opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed" 
        style={{
          backgroundImage: `url('/@assets/generated_images/Calacatta_Gold_Marble_Texture_fbe43c38.png')`,
          opacity: 0.65
        }}
      />
      
      {/* Luxury Depth Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-amber-50/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/10 via-transparent to-amber-200/10" />
      
      {/* Luxury Gradient Orbs (Max 2 for performance) */}
      <div className="luxury-gradient-orb-1 top-10 right-10" />
      <div className="luxury-gradient-orb-2 bottom-10 left-10" />

      {/* Luxury Floating Elements with Golden Glow */}
      <div className="absolute top-20 right-16 miami-float group">
        <Sparkles 
          className="text-amber-500 transition-all duration-500 drop-shadow-lg" 
          size={36}
          style={{
            filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.6))'
          }}
        />
      </div>
      <div className="absolute bottom-24 left-16 miami-float group" style={{ animationDelay: '3s' }}>
        <Sparkles 
          className="text-yellow-600 transition-all duration-500 drop-shadow-lg" 
          size={28}
          style={{
            filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
          }}
        />
      </div>

      {/* Hero Content with Luxury Styling */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 py-20">
        {/* Main Headline with Metallic Gold Gradient */}
        <h1 className="luxury-hero-headline text-6xl md:text-8xl mb-8 leading-tight">
          Life's <span className="luxury-hero-headline">BETTER</span> when you're<br />
          Living Like a <span className="luxury-hero-headline">LOCAL</span>
        </h1>
        
        {/* Subheadline with Elegant Typography */}
        <p className="luxury-hero-subheadline text-xl md:text-2xl mb-14 mx-auto">
          Discover, connect, and thrive with Florida's most vibrant business community. 
          Where local entrepreneurs build lasting relationships and grow together.
        </p>

        {/* Luxury CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-20">
          <Button 
            className="btn-luxury-hero-primary px-10 py-6 text-lg font-bold rounded-xl shadow-2xl"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-join-community"
          >
            <span className="relative z-10">Join the Community</span>
          </Button>
          <Button 
            className="btn-luxury-hero-secondary px-10 py-6 text-lg font-bold rounded-xl shadow-xl"
            data-testid="button-explore-businesses"
          >
            <span className="relative z-10">Explore Businesses</span>
          </Button>
        </div>

        {/* Luxury Search Container */}
        <div className="max-w-4xl mx-auto">
          <div className="luxury-hero-search rounded-2xl p-10 luxury-hero-depth">
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search Input with Enhanced Glass Effect */}
                <div className="flex-1 relative group">
                  <Search 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-700 group-hover:text-amber-600 transition-colors duration-300" 
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(212, 175, 55, 0.4))'
                    }}
                  />
                  <Input 
                    type="search" 
                    placeholder="What type of business are you looking for?" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-5 bg-white/40 backdrop-blur-md border-2 border-amber-200/50 rounded-xl text-slate-900 placeholder-slate-600 focus:border-amber-400 focus:bg-white/60 transition-all duration-300 font-medium shadow-lg"
                    data-testid="input-search-businesses"
                    style={{
                      boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                    }}
                  />
                </div>

                {/* City Select with Enhanced Glass Effect */}
                <div className="flex-1 relative group">
                  <MapPin 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-700 group-hover:text-amber-600 transition-colors duration-300 z-10" 
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(212, 175, 55, 0.4))'
                    }}
                  />
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger 
                      className="w-full pl-12 pr-4 py-5 bg-white/40 backdrop-blur-md border-2 border-amber-200/50 rounded-xl text-slate-900 hover:border-amber-300 focus:border-amber-400 focus:bg-white/60 transition-all duration-300 font-medium shadow-lg" 
                      data-testid="select-city"
                      style={{
                        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-amber-200 shadow-2xl">
                      <SelectItem value="miami">🏖️ Miami</SelectItem>
                      <SelectItem value="orlando">🎢 Orlando</SelectItem>
                      <SelectItem value="tampa">⚡ Tampa</SelectItem>
                      <SelectItem value="jacksonville">🌊 Jacksonville</SelectItem>
                      <SelectItem value="fort-lauderdale">⛵ Fort Lauderdale</SelectItem>
                      <SelectItem value="tallahassee">🏛️ Tallahassee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Luxury Search Button */}
                <Button 
                  className="btn-luxury-hero-primary px-10 py-5 rounded-xl shadow-xl group font-bold"
                  onClick={handleSearch}
                  data-testid="button-search-hero"
                >
                  <Search className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Search</span>
                </Button>
              </div>
              
              {/* Quick Filter Tags with Luxury Styling */}
              <div className="flex flex-wrap gap-3 mt-8 justify-center">
                {['Restaurants', 'Wellness', 'Beauty', 'Shopping', 'Events'].map((category) => (
                  <button
                    key={category}
                    className="px-5 py-2.5 bg-white/30 backdrop-blur-md border-2 border-amber-200/40 text-slate-800 hover:text-slate-900 hover:bg-white/50 hover:border-amber-300 text-sm font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1"
                    style={{
                      boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <span className="relative z-10">{category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce group cursor-pointer z-10">
        <ChevronDown 
          className="text-amber-700 group-hover:text-amber-600 transition-colors duration-300" 
          size={32}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(212, 175, 55, 0.4))'
          }}
        />
      </div>
    </section>
  );
}

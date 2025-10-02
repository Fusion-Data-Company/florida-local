import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Facebook, Instagram, Youtube, Twitter, Moon, User,
  MapPin, Star, Phone, Calendar, ChevronLeft, ChevronRight,
  Heart, Bookmark, Play
} from "lucide-react";

export default function FloridaLocalElite() {
  const [activeTab, setActiveTab] = useState("restaurants");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* 1. SITE HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search travel, food..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-red-500 fill-red-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                THE FLORIDA LOCALS
              </span>
            </div>

            {/* Social & Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION - BEACH VIDEO */}
      <section className="relative h-[80vh] overflow-hidden">
        {/* Video Background Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-teal-300 to-cyan-400">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920')] bg-cover bg-center opacity-60"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* 4K Badge */}
        <div className="absolute top-8 left-8 z-10">
          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/40 px-4 py-2">
            4K Cinematic Video | Florida, USA – By Drone
          </Badge>
        </div>

        {/* Hero Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
          <h1 className="text-7xl md:text-8xl font-bold text-white mb-6 drop-shadow-2xl">
            The Florida Local
          </h1>
          <p className="text-3xl md:text-4xl text-white font-light max-w-4xl drop-shadow-lg">
            Life's is BETTER when you're Living Like a <span className="font-bold">LOCAL</span>.
          </p>
        </div>
      </section>

      {/* 3. FOODIES, CREATORS & COLLABORATORS SLIDER */}
      <section className="py-16 bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            The Florida Local | Foodies, Creators & Collaborators
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { tag: "#4EverTourist", caption: "#4Boho Out In the D.R.", color: "bg-orange-500" },
              { tag: "#ipowermoves", caption: "Sarah Insure", color: "bg-purple-500" },
              { tag: "#itsGoodAF", caption: "Explore With Kenzo & Ben", color: "bg-yellow-500" },
              { tag: "#effintrendy", caption: "OASIS Tropic Wear", color: "bg-pink-500" },
              { tag: "#NeverHuntAlone", caption: "HOW TO BE FEATURED", color: "bg-green-500" }
            ].map((item, i) => (
              <Card key={i} className="group overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative h-96">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                  <Badge className={`${item.color} absolute top-4 left-4 text-white font-bold uppercase z-10 px-4 py-2`}>
                    {item.tag}
                  </Badge>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <p className="text-white font-semibold text-lg">{item.caption}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURING | THE FLORIDA LOCAL LIFESTYLE */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <Badge className="bg-purple-500 text-white w-fit mb-4 px-4 py-2">
                    FEATURED LOCAL PAGES
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">By The Locals • March 25, 2024</p>
                  <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    The Florida Local
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    It's ALL ABOUT US. Be Featured #ItsGoodAF | #4EverTourist
                  </p>
                </div>
                <div className="relative h-96 md:h-auto bg-gradient-to-br from-blue-300 to-teal-300">
                  {/* Beach aerial image placeholder */}
                </div>
              </div>
            </Card>

            <div className="mt-8 text-center">
              <a href="#" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-lg hover:underline">
                Follow The Orlando Locals On IG!
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FLORIDA LAKE LIFE FEATURE */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <Badge className="bg-blue-500 text-white w-fit mb-4 px-4 py-2">
                    FEATURED
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • July 17, 2023</p>
                  <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Florida Lake Life With Kelli & Jason @TheOrlandoLocals
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto bg-gradient-to-br from-teal-300 to-blue-400">
                  {/* Kayaking couple image placeholder */}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. FEATURED | LOCAL YELP ELITE - LOCAL FOODIE VERIFIED */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Left Column - Large Image */}
            <Card className="rounded-3xl overflow-hidden shadow-2xl">
              <div className="h-full bg-gradient-to-br from-amber-400 to-orange-500 p-8 flex flex-col justify-end">
                <Badge className="bg-white/20 backdrop-blur-md text-white w-fit mb-4 px-4 py-2">
                  FEATURED
                </Badge>
                <p className="text-white font-semibold text-lg">Ivanhoe Park Brewing Co.</p>
              </div>
            </Card>

            {/* Center - CTA */}
            <div className="flex flex-col items-center justify-center">
              <Button className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-2xl font-bold px-12 py-8 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 mb-12">
                You've GOTTA Try This!
              </Button>

              <div className="w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white rounded-2xl p-2 shadow-lg">
                    <TabsTrigger value="restaurants" className="rounded-xl">Local Restaurants</TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-xl">Foodie Reviews</TabsTrigger>
                    <TabsTrigger value="menus" className="rounded-xl">Menus</TabsTrigger>
                  </TabsList>
                  <TabsContent value="restaurants" className="mt-6 space-y-4">
                    {[
                      "Have You Tried Nona's Urban Pizza Yet?",
                      "Paella Tuesday at Turulls",
                      "Cilantrillo New Restaurant Opening in Old Town Kissimmee",
                      "DON TURULL CAFE, Bonafide Agricultural Company w/ Coffee Straight from PR"
                    ].map((title, i) => (
                      <Card key={i} className="p-4 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <p className="font-semibold text-gray-800">{title}</p>
                      </Card>
                    ))}
                  </TabsContent>
                  <TabsContent value="reviews" className="mt-6 space-y-4">
                    <Card className="p-4 rounded-2xl">
                      <p className="font-semibold text-gray-800">Foodie reviews coming soon...</p>
                    </Card>
                  </TabsContent>
                  <TabsContent value="menus" className="mt-6 space-y-4">
                    <Card className="p-4 rounded-2xl">
                      <p className="font-semibold text-gray-800">Menu highlights coming soon...</p>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Column - Collage */}
            <div className="space-y-4">
              <Badge className="bg-red-500 text-white font-bold px-6 py-3 rounded-full shadow-lg">
                Local Foodie Verified
              </Badge>
              <Card className="rounded-3xl overflow-hidden shadow-2xl h-64 bg-gradient-to-br from-pink-300 to-purple-400">
              </Card>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-orange-500" />
                ORLANDO | ✅ Top Recommended Dishes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LOCALS | EAST ORLANDO FLAVOR - TURULL'S BOQUERIA */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Locals | East Orlando Flavor
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Restaurant Info */}
            <div>
              <h3 className="text-4xl font-bold mb-4">Turull's Boqueria</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 opacity-50" />
                </div>
                <span className="text-gray-600">(52 reviews)</span>
              </div>
              <p className="text-lg mb-4">$30 and under • Spanish</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Great For Live Music", "Lively", "Great For Brunch"].map((tag, i) => (
                  <Badge key={i} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Diverse menu with authentic Spanish tapas, paella, and more. Perfect for group dining and celebrations.
              </p>
              <a href="#" className="text-purple-600 font-semibold hover:underline">Read more →</a>
            </div>

            {/* Reservation Card */}
            <Card className="p-8 flex flex-col items-center justify-center text-center rounded-3xl shadow-xl bg-white">
              <div className="text-6xl mb-4">🍷</div>
              <h4 className="text-2xl font-bold mb-6">Reserve Your Table</h4>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 rounded-full text-lg">
                Click Here to Reserve a Table Today!
              </Button>
            </Card>
          </div>

          {/* Image Carousel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-bold">España Cuisine 🇪🇸 | Check Our Menu</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-orange-300 to-red-400 shadow-lg"></Card>
              ))}
            </div>
          </div>

          {/* Map & CTA */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="rounded-2xl overflow-hidden h-64 bg-gray-200">
              {/* Google Map Placeholder */}
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <MapPin className="h-12 w-12" />
              </div>
            </Card>
            <div className="flex items-center justify-center">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl px-12 py-8 rounded-full shadow-2xl">
                Book a Reservation Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. #ITSGOODAF | EVERY DAY IS A VACATION */}
      <section className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600">
          {/* Sunset jet ski image placeholder */}
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/40 px-6 py-3 mb-6 text-lg">
            #ItsGoodAF | You've Gotta Try This!
          </Badge>
          <h2 className="text-6xl font-bold text-white mb-4">Every Day is A Vacation</h2>
          <p className="text-2xl text-white/90">– #4EverTourist – | #TheOrlando Locals</p>
        </div>
      </section>

      {/* 9. CENTRAL FLORIDA INSURANCE SCHOOL PROMOTION */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-8">
              Looking For a New Career… It's Always Healthcare Awareness Month
            </h2>
            
            <Card className="bg-white text-gray-900 rounded-3xl shadow-2xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="text-2xl font-bold">Central Florida Insurance School</h3>
                <Badge className="bg-blue-600 text-white px-4 py-2">DPS Authorized Insurance Ed Provider</Badge>
              </div>
              <div className="flex gap-6 justify-center text-sm font-semibold flex-wrap">
                <a href="#" className="hover:text-blue-600">Home</a>
                <a href="#" className="hover:text-blue-600">Fast Agent Pre-Licensing</a>
                <a href="#" className="hover:text-blue-600">Continuing Education</a>
                <a href="#" className="hover:text-blue-600">Blog</a>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Contact</span>
                </div>
              </div>
            </Card>

            <Badge className="bg-white/20 backdrop-blur-md text-white mb-6 px-6 py-3">
              As Seen On...
            </Badge>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-blue-300 to-purple-400"></Card>
              ))}
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6">
              <h4 className="text-2xl font-bold mb-2">The Insurance School | We Make Pre-Licensing Easy</h4>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. IPOWERMOVES LIVE PODCAST */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 text-4xl font-bold flex flex-wrap">
          {Array(20).fill("NEVER HUNT ALONE – Connect | Collaborate").map((text, i) => (
            <span key={i} className="whitespace-nowrap px-4">{text}</span>
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 text-xl font-bold mb-8 mx-auto block w-fit rounded-full shadow-2xl">
            Enroll Today | Insurance Careers Start Here
          </Badge>

          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">iPOWERMOVES LIVE PODCAST</h2>
            <p className="text-center text-2xl mb-12 text-gray-300">View Our Next Live Class!</p>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              {/* Video Player */}
              <Card className="rounded-3xl overflow-hidden aspect-video bg-black flex items-center justify-center border-4 border-white/10">
                <div className="text-center">
                  <Play className="h-20 w-20 text-white/50 mx-auto mb-4" />
                  <p className="text-white/50">Video Unavailable</p>
                </div>
              </Card>

              {/* App Download */}
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-8">Download the iPowerMoves App</h3>
                <div className="flex flex-col gap-4 justify-center mb-8">
                  <Button className="bg-black text-white px-8 py-6 rounded-2xl text-lg hover:bg-gray-800 w-full">
                    <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Download on App Store
                  </Button>
                  <Button className="bg-black text-white px-8 py-6 rounded-2xl text-lg hover:bg-gray-800 w-full">
                    <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Get it on Google Play
                  </Button>
                </div>
              </div>
            </div>

            {/* Social Subscribe Links */}
            <div className="text-center">
              <p className="text-xl mb-6">Subscribe on your favorite platform:</p>
              <div className="flex gap-6 justify-center text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  <Youtube className="h-8 w-8" />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.5,2C7,2 2.5,6.5 2.5,12C2.5,17.5 7,22 12.5,22C18,22 22.5,17.5 22.5,12C22.5,6.5 18,2 12.5,2M12.5,20A8,8 0 0,1 4.5,12A8,8 0 0,1 12.5,4A8,8 0 0,1 20.5,12A8,8 0 0,1 12.5,20M13.19,11.5L10.93,10.82L10.93,12.18L13.19,11.5Z"/>
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M9.5,8.5L14.5,12L9.5,15.5V8.5Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. ENTREPRENEURS, CREATORS & COLLABORATORS */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl px-8 py-4 mb-12 mx-auto block w-fit rounded-full font-bold shadow-xl">
            Entrepreneurs, Creators & Collaborators
          </Badge>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { title: "The Insurance School | We Make...", color: "from-blue-300 to-purple-400" },
              { title: "Power Moves | The Mo-Fo's Who are...", color: "from-teal-300 to-blue-400" },
              { title: "Neil Schwabe, MGA With United...", color: "from-green-300 to-teal-400" },
              { title: "Tactical Brewing Newest Released...", color: "from-orange-300 to-pink-400" }
            ].map((item, i) => (
              <Card key={i} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <div className={`h-64 bg-gradient-to-br ${item.color}`}></div>
                <CardContent className="p-6">
                  <Badge className="bg-green-500 text-white mb-3 px-3 py-1 rounded-full text-xs">
                    FEATURED
                  </Badge>
                  <h4 className="font-bold text-lg">{item.title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 12. IPOWER MOVES & CARIBBEAN LOCALS SLIDER */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto mb-12">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <Badge className="bg-pink-500 text-white w-fit mb-4 px-4 py-2">
                    #TheCaribbeanLocals
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • June 10, 2024</p>
                  <h3 className="text-4xl font-bold mb-6">
                    I ❤️ PR | Jan & Lauras Island Excursions
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto bg-gradient-to-br from-pink-300 to-purple-400">
                  {/* PR sign couple image placeholder */}
                </div>
              </div>
            </Card>
          </div>

          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl px-8 py-4 mb-8 mx-auto block w-fit rounded-full font-bold">
            Power of We | Shop Local #NeverHuntAlone
          </Badge>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Steffieemariee – DR is In",
              "Island Hopping In Punta Cana DR",
              "Clear Water Beach on a Charge",
              "Caribbean Hotspots, Visit Punta Cana..."
            ].map((title, i) => (
              <Card key={i} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <div className="h-64 bg-gradient-to-br from-blue-300 to-teal-400"></div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-lg">{title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 13. DENTAL SPOTLIGHT - SIAN DENTAL STUDIO */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-5xl font-bold text-center mb-4">
            ORLANDO | Your SMILE Is Contagious
          </h2>
          <p className="text-2xl text-center mb-12 text-gray-600">
            Dr. Mario | THE ORLANDO LOCAL DENTIST
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Before/After Photos Slider */}
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-blue-200 to-purple-300"></Card>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                ))}
              </div>
            </div>

            {/* Map */}
            <Card className="rounded-2xl overflow-hidden bg-gray-200">
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <MapPin className="h-16 w-16 text-blue-600 mb-4" />
                <h4 className="font-bold text-xl mb-2">Sian Dental Studio</h4>
                <p className="text-center text-gray-600">508 N Mills Ave B, Orlando FL</p>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xl px-12 py-8 rounded-full shadow-2xl">
              Sian Dental 🦷 Schedule a Virtual Visit Here
            </Button>
          </div>
        </div>
      </section>

      {/* 14. THE FLORIDA LOCAL - FEATURED COLLABORATORS & FOODIE EXPERTS */}
      <section className="py-16 bg-gradient-to-br from-green-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl px-8 py-4 mb-6 mx-auto block w-fit rounded-full font-bold">
            The Florida Local – Featured Collaborators
          </Badge>

          <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-2xl px-8 py-4 mb-12 mx-auto block w-fit rounded-full font-bold">
            #itsGoodAF | The Local Foodie Experts
          </Badge>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="h-64 bg-gradient-to-br from-orange-300 to-pink-400"></div>
              </Card>
            ))}
            <Card className="rounded-3xl overflow-hidden shadow-xl bg-yellow-400 flex items-center justify-center">
              <div className="text-center p-8">
                <Heart className="h-16 w-16 mx-auto mb-4 text-white" />
                <Button className="bg-white text-yellow-600 hover:bg-gray-100 rounded-full px-8 py-4 font-bold italic">
                  Read More
                </Button>
              </div>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto mb-12 p-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-3xl text-center text-white shadow-2xl">
            <Heart className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Send Us Your Foodie Reels</h3>
            <p className="text-xl">Featured iFastSocial Subscriptions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              "5 of The Best Spots For Healthy Foodies in Orlando",
              "Happy Birthday! @LexyMonty",
              "Felez Lunes a Todos From Hiram!"
            ].map((title, i) => (
              <Card key={i} className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <h4 className="font-bold text-lg mb-2">{title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bookmark className="h-4 w-4" />
                  <span>0 Views • 0 Comments</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 15. IPOWERMOVES - INDEPENDENT POWER MOVES */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <Badge className="bg-blue-500 text-white w-fit mb-4 px-4 py-2">
                    #SpaceCoastLocals
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • January 8, 2024</p>
                  <h3 className="text-4xl font-bold mb-6">
                    The City Council of Palm Bay Joins the Space Coast Locals
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto bg-gradient-to-br from-blue-300 to-purple-400">
                  {/* City council ceremony image placeholder */}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 16. CILANTRILLO RESTAURANT MENU & FOODIE POSTS */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Foodie Posts */}
            <div className="space-y-6">
              <Card className="rounded-3xl overflow-hidden shadow-xl">
                <div className="h-64 bg-gradient-to-br from-orange-300 to-red-400"></div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2">Fly Guy Pizza Guy W/ @EatsWithAlicia</h4>
                  <p className="text-gray-600">Woman enjoying cheesy pizza</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl overflow-hidden shadow-xl">
                <div className="h-64 bg-gradient-to-br from-yellow-300 to-orange-400"></div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2">Tibby's New Orleans Kitchen with Baloo Eats</h4>
                  <p className="text-gray-600">Smiling man enjoying a drink</p>
                </CardContent>
              </Card>
            </div>

            {/* Right: Restaurant Menu */}
            <Card className="rounded-3xl shadow-xl p-8">
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                El Cilantrillo Restaurant
              </h3>

              <Tabs defaultValue="entrees" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-2xl p-2">
                  <TabsTrigger value="entrees" className="rounded-xl">Cilantrillo Entrees</TabsTrigger>
                  <TabsTrigger value="appetizers" className="rounded-xl">Appetizers</TabsTrigger>
                  <TabsTrigger value="news" className="rounded-xl">News</TabsTrigger>
                </TabsList>
                <TabsContent value="entrees" className="mt-6 space-y-4">
                  {[
                    "MAIN ENTREES 🇵🇷",
                    "EL PARRADÓN 🇵🇷",
                    "STUFFED MOFONGOS 🇵🇷",
                    "AFRENTAOS 🇵🇷"
                  ].map((item, i) => (
                    <Card key={i} className="p-4 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                      <p className="font-semibold text-lg">{item}</p>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="appetizers" className="mt-6">
                  <Card className="p-4 rounded-2xl">
                    <p className="text-gray-600">Appetizers menu coming soon...</p>
                  </Card>
                </TabsContent>
                <TabsContent value="news" className="mt-6">
                  <Card className="p-4 rounded-2xl">
                    <p className="font-semibold mb-2">Los pasteles llevan Ketchup?</p>
                    <p className="text-gray-600">Ayúdanos a resolver este problema</p>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </section>

      {/* 17. #EFFINTRENDY - MUSIC, FASHION & LIFESTYLE (Already included earlier, enhanced version) */}

      {/* 18. FEATURED ENTREPRENEURS - IFASTSOCIAL ENDORSEMENT */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-yellow-100 to-pink-100">
                  <Badge className="bg-purple-500 text-white w-fit mb-4 px-4 py-2">
                    #iPowerMoves
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • August 6, 2023</p>
                  <h3 className="text-4xl font-bold mb-6">
                    iFastSocial – Be Featured in Our Endorsement…
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto bg-yellow-400 flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-4">iFastSocial</div>
                    <p className="text-2xl font-semibold">Connecting Local Businesses</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 19. #IPOWERMOVES - ENTREPRENEUR SPOTLIGHT & CREATORS GRID */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="container mx-auto px-4">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl px-8 py-4 mb-12 mx-auto block w-fit rounded-full font-bold">
            #iPowerMoves | Entrepreneur Spotlight – The Florida Local –
          </Badge>

          <h3 className="text-3xl font-bold text-center mb-12">The Florida Local Creators & Collaborators</h3>

          <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Left: Featured Posts Grid */}
            <div className="space-y-6">
              {[
                { title: "Step into the AM | Orlando Aston Martin Unveils The New DB12", tag: "#TheOrlandoLocals", date: "September 8, 2024" },
                { title: "Caribbean Hotspots, Visit Punta Cana D.R. – for Your Next Trip!", tag: "#EffinTrendy", date: "June 11, 2024" },
                { title: "MAIN ENTREE's", tag: "Cilantrillo Entrees", date: "June 11, 2024" },
                { title: "STUFFED MOFONGOS", tag: "Cilantrillo Entrees", date: "June 11, 2024" }
              ].map((post, i) => (
                <Card key={i} className="p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <Badge className="bg-purple-100 text-purple-700 mb-3 px-3 py-1 rounded-full text-xs">
                    {post.tag}
                  </Badge>
                  <h4 className="font-bold text-xl mb-2">{post.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{post.date}</span>
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      <span>0 Views</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right: Additional Links */}
            <div className="space-y-4">
              <h4 className="text-2xl font-bold mb-6">More Stories</h4>
              {[
                "Step into the AM | Orlando Aston Martin Unveils The New DB12",
                "iFastSocial – Be Featured in Our Endorsement",
                "iPower Moves | Creating Content For the Insurance Industry",
                "Florida Lake Life With Kelli & Jason @TheOrlandoLocals",
                "I ❤️ PR | Jan & Lauras Island Excursions",
                "The City Council of Palm Bay Joins the Space Coast Locals"
              ].map((title, i) => (
                <Card key={i} className="p-4 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
                  <p className="font-semibold text-sm">{title}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 20. CATEGORIES & TAG CLUSTERS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Explore By Category</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 max-w-7xl mx-auto scrollbar-hide">
            {[
              { tag: "#ItsGoodAf", count: 30, color: "from-orange-400 to-red-500" },
              { tag: "#KidPowerMoves", count: 1, color: "from-blue-400 to-cyan-500" },
              { tag: "#NeverHuntAlone", count: 1, color: "from-green-400 to-emerald-500" },
              { tag: "#SideHustles", count: 3, color: "from-purple-400 to-pink-500" },
              { tag: "#EffinTrendy", count: 13, color: "from-pink-400 to-rose-500" },
              { tag: "#iFastSocial", count: 14, color: "from-yellow-400 to-orange-500" },
              { tag: "#incrediblein", count: 18, color: "from-indigo-400 to-purple-500" },
              { tag: "#iPowerMoves", count: 6, color: "from-teal-400 to-blue-500" }
            ].map((item, i) => (
              <Card key={i} className={`flex-shrink-0 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer min-w-[280px]`}>
                <div className={`h-32 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm"></div>
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2">{item.tag}</h4>
                  <p className="text-gray-600">{item.count} Post{item.count !== 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 21. DARK PURPLE ARTICLE LIST & FOOTER */}
      <section className="py-12 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Step into the AM | Orlando Aston Martin Unveils The New DB12",
              "Caribbean Hotspots, Visit Punta Cana D.R. – for Your Next Trip!",
              "MAIN ENTREE's",
              "EL PARRADÓN",
              "STUFFED MOFONGOS",
              "AFRENTAOS"
            ].map((title, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <span>0 View</span>
                    <span>0 Comment</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative py-16 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white overflow-hidden">
        {/* Mountain silhouette effect */}
        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-20">
          <svg viewBox="0 0 1200 120" className="w-full h-full">
            <path d="M0,60 L300,20 L600,50 L900,10 L1200,40 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-12">
            {/* Categories */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-purple-300">Categories</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Term Of Use</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Release Notes</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Upgrade Guide</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Travel</a></li>
              </ul>
            </div>

            {/* Pages */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-purple-300">Pages</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Installation</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">IntelliSense</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Browser Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Upgrade Guide</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-purple-300">Social</h4>
              <p className="text-gray-300 mb-6">Connect with The Florida Locals on social media for the latest updates and local stories.</p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Youtube className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-gray-400">
              Copyright © 2023 The Locals. Created By{" "}
              <a href="https://ifastsocial.com" className="text-purple-300 hover:text-white transition-colors font-semibold">
                iFastSocial.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


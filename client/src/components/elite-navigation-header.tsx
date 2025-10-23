import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, X, Home, MapPin, Store, MessageSquare, ShoppingCart, Package, Building2, ScrollText, Sparkles, Trophy, Users, Gift, Star, TrendingUp, BarChart3, Target, BookOpen, Monitor, Shield, Megaphone, Workflow, FileText, User, Briefcase, Rocket, CreditCard, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import CartIcon from "@/components/cart-icon";
import NotificationCenter from "@/components/notification-center";
import VoiceShopModal from "@/components/voice-shop-modal";
import type { Business } from "@shared/types";
import { Link as WouterLink } from "wouter";

export default function EliteNavigationHeader() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Fetch user businesses
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  // Fetch loyalty account for points display
  const { data: loyaltyAccount } = useQuery<{ currentPoints: number; tierName: string }>({
    queryKey: ['/api/loyalty/account'],
    enabled: isAuthenticated,
  });

  // Elite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePath = (path: string) => {
    // Exact match for home route to prevent Discover from always being highlighted
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  // APPLE-STYLE NAVIGATION ITEMS - CLEAN & MINIMAL
  const navigationItems = [
    { href: "/", label: "Discover", icon: Home, testId: "nav-discover" },
    { href: "/marketplace", label: "Marketplace", icon: Store, testId: "nav-marketplace" },
    { href: "/messages", label: "Messages", icon: MessageSquare, testId: "nav-messages" },
    { href: "/community", label: "Community", icon: Users, testId: "nav-community" },
    { href: "/registry", label: "Entrepreneurs", icon: Briefcase, testId: "nav-entrepreneurs" },
    { href: "/florida-local", label: "Florida Local", icon: MapPin, testId: "nav-florida-local" },
    { href: "/ai/tools", label: "AI Tools", icon: Sparkles, testId: "nav-ai-tools" },
  ];

  return (
    <>
      {/* GREY MARBLE GLASS HEADER - APPLE STYLE */}
      <header className={`elite-glass-header sticky top-0 w-full ${scrolled ? 'scrolled' : ''}`} style={{ zIndex: 9999, pointerEvents: 'auto' }}>
        <div className="container mx-auto px-6" style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
          <div className="flex items-center justify-between" style={{ height: '72px', pointerEvents: 'auto' }}>

            {/* FLORIDA LOCAL LOGO - ULTRA-ELITE TREATMENT */}
            <Link href="/" className="elite-logo-container flex items-center" data-testid="brand-logo">
              <img
                src="/new-logo-trans.webp"
                alt="The Florida Local"
                className="w-auto object-contain transition-all duration-300 hover:scale-105"
                style={{
                  height: '70px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 0 8px rgba(255,255,255,0.3))'
                }}
              />
            </Link>

            {/* NAVIGATION - FIXED SIZES */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center" style={{ gap: '4px' }}>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`elite-nav-item ${isActivePath(item.href) ? 'elite-nav-active' : ''}`}
                      data-testid={item.testId}
                      style={{ color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}
                    >
                      <IconComponent />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* BUSINESS DROPDOWN - FIXED SIZE */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="elite-nav-item" style={{ gap: '6px', color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                    <Building2 style={{ width: '18px', height: '18px' }} />
                    <span>Business</span>
                    <ChevronDown style={{ width: '14px', height: '14px', marginLeft: '-2px' }} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="elite-glass-dropdown w-52" style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(0, 139, 139, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 139, 139, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}>
                    {userBusinesses.length > 0 ? (
                      <>
                        {/* Profile Section */}
                        <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#008B8B] to-[#d4af37] bg-clip-text text-transparent">PROFILES</div>
                        <DropdownMenuItem asChild>
                          <Link href={`/entrepreneur/${user?.id}`}>
                            <User className="h-4 w-4 mr-2 inline text-purple-600" />
                            Entrepreneur Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/business/${userBusinesses[0].id}`}>
                            <Building2 className="h-4 w-4 mr-2 inline" />
                            Business Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Management Section */}
                        <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#008B8B] to-[#d4af37] bg-clip-text text-transparent">MANAGEMENT</div>
                        <DropdownMenuItem asChild>
                          <Link href="/business-dashboard">
                            <BarChart3 className="h-4 w-4 mr-2 inline" />
                            Business Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {/* Marketing & Growth */}
                        <DropdownMenuItem asChild>
                          <Link href="/marketing">
                            <Target className="h-4 w-4 mr-2 inline text-purple-600" />
                            Marketing Hub
                            <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">NEW</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/blog/manage">
                            <BookOpen className="h-4 w-4 mr-2 inline text-green-600" />
                            Blog Manager
                            <span className="ml-auto text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">NEW</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/social-hub">
                            <Megaphone className="h-4 w-4 mr-2 inline text-blue-600" />
                            Social Media Hub
                            <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Analytics & AI */}
                        <DropdownMenuItem asChild>
                          <Link href="/business-analytics">
                            <TrendingUp className="h-4 w-4 mr-2 inline" />
                            Business Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/ai/content-generator">
                            <Sparkles className="h-4 w-4 mr-2 inline" />
                            AI Content Generator
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Community & Growth */}
                        <DropdownMenuItem asChild>
                          <Link href="/spotlight/voting">
                            <Trophy className="h-4 w-4 mr-2 inline text-amber-600" />
                            Vote
                            <span className="ml-auto text-xs">🔥</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/loyalty">
                            <Gift className="h-4 w-4 mr-2 inline text-purple-600" />
                            Rewards
                            <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">NEW</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/subscription">
                            <CreditCard className="h-4 w-4 mr-2 inline text-[#d4af37]" />
                            Subscription
                            <span className="ml-auto text-xs bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-white px-1.5 py-0.5 rounded font-semibold">PRO</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Products & Store */}
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/products">
                            <Package className="h-4 w-4 mr-2 inline" />
                            Manage Products
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/payouts">
                            <ShoppingCart className="h-4 w-4 mr-2 inline" />
                            Payouts & Billing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Integrations */}
                        <DropdownMenuItem asChild>
                          <Link href="/integrations/gmb">
                            <MapPin className="h-4 w-4 mr-2 inline" />
                            GMB Integration
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/business/${userBusinesses[0].id}/edit`}>Edit Business</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/create-business">Create Another</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/create-business">Create Business</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            )}

            {/* USER MENU - FIXED SIZES */}
            <div className="flex items-center" style={{ gap: '24px', position: 'relative', zIndex: 200, overflow: 'visible' }}>
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center" style={{ gap: '24px', position: 'relative', zIndex: 200, overflow: 'visible' }}>
                    <NotificationCenter />
                    {loyaltyAccount && (
                      <WouterLink href="/loyalty">
                        <Button
                          variant="ghost"
                          className="rounded-lg hover:bg-black/5 transition-all flex items-center gap-2"
                          style={{ height: '40px', padding: '0 12px' }}
                        >
                          <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                          <span className="font-semibold text-sm bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                            {loyaltyAccount.currentPoints.toLocaleString()}
                          </span>
                        </Button>
                      </WouterLink>
                    )}

                    {/* Voice Shop Microphone Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:scale-110 transition-all duration-300"
                      style={{
                        width: '52px',
                        height: '52px',
                        padding: 0,
                        background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(168, 85, 247, 0.15) 100%)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        border: '2px solid rgba(168, 85, 247, 0.4)',
                        borderTop: '2px solid rgba(168, 85, 247, 0.6)',
                        borderLeft: '2px solid rgba(168, 85, 247, 0.5)',
                        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.35), inset 0 3px 6px rgba(168, 85, 247, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 0 30px rgba(168, 85, 247, 0.3)'
                      }}
                      data-testid="button-voice-shop"
                      onClick={() => setVoiceModalOpen(true)}
                    >
                      <Mic className="h-6 w-6 text-purple-400" />
                    </Button>

                    <CartIcon />
                  </div>

                  {/* USER AVATAR - FIXED SIZE WITH METALLIC RING */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="rounded-full hover:scale-105 transition-all duration-300"
                        style={{
                          width: '52px',
                          height: '52px',
                          padding: 0,
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.15) 100%)',
                          backdropFilter: 'blur(20px) saturate(180%)',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          borderTop: '2px solid rgba(255, 255, 255, 0.6)',
                          borderLeft: '2px solid rgba(255, 255, 255, 0.5)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 3px 6px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 0 30px rgba(255, 255, 255, 0.2), 0 1px 0 rgba(255, 255, 255, 0.7) inset'
                        }}
                      >
                        <Avatar style={{ width: '48px', height: '48px', boxShadow: '0 0 16px rgba(5, 150, 105, 0.5)' }}>
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-lg text-white" style={{
                            fontSize: '36px',
                            fontFamily: "'Great Vibes', 'Edwardian Script ITC', 'Kunstler Script', 'Monotype Corsiva', cursive",
                            fontWeight: 400,
                            fontStyle: 'normal',
                            background: 'linear-gradient(145deg, #34d399 0%, #10b981 15%, #059669 35%, #047857 60%, #065f46 85%, #064e3b 100%)',
                            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.3), inset -2px 0 4px rgba(0, 0, 0, 0.2), inset 2px 0 4px rgba(255, 255, 255, 0.2)',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.5)'
                          }}>
                            {user?.firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="elite-glass-dropdown w-52" style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(0, 139, 139, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 139, 139, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}>
                      {/* Personal Section */}
                      <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#008B8B] to-[#d4af37] bg-clip-text text-transparent">PERSONAL</div>
                      <DropdownMenuItem asChild>
                        <Link href={`/entrepreneur/${user?.id}`}>
                          <User className="h-4 w-4 mr-2 inline" />
                          My Entrepreneur Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <Briefcase className="h-4 w-4 mr-2 inline" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/timeline">
                          <Rocket className="h-4 w-4 mr-2 inline text-purple-600" />
                          Timeline Feed
                          <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">NEW</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user?.id === "1" && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">ADMIN</div>
                          <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <Shield className="h-4 w-4 mr-2 inline" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/monitoring">
                              <Monitor className="h-4 w-4 mr-2 inline text-red-600" />
                              System Monitoring
                              <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">NEW</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/analytics">
                              <BarChart3 className="h-4 w-4 mr-2 inline" />
                              Platform Analytics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/marketing">
                              <Target className="h-4 w-4 mr-2 inline text-purple-600" />
                              Marketing Oversight
                              <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">NEW</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href="/api/logout" className="text-red-600">Sign Out</a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/subscription">
                    <Button
                      variant="ghost"
                      className="rounded-lg hover:bg-black/5 transition-all text-[#008B8B] font-semibold"
                      style={{ height: '40px', padding: '0 20px', fontSize: '15px', position: 'relative', zIndex: 10000, pointerEvents: 'auto', cursor: 'pointer' }}
                    >
                      Subscriptions
                    </Button>
                  </Link>
                  <Button
                    onClick={(e) => {
                      try {
                        window.location.href = '/api/login';
                      } catch (error) {
                        console.error('❌ Login button error:', error);
                        alert('Failed to initiate login. Please refresh the page and try again.');
                      }
                    }}
                    className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#B8941F] hover:to-[#D4AF37] text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      height: '40px',
                      padding: '0 24px',
                      fontSize: '15px',
                      fontWeight: 600,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      border: '2px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 4px 12px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                      position: 'relative',
                      zIndex: 10000,
                      pointerEvents: 'auto',
                      cursor: 'pointer'
                    }}
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </>
              )}

              {/* MOBILE MENU TOGGLE - FIXED SIZE */}
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden rounded-lg hover:bg-black/5"
                style={{ width: '40px', height: '40px', padding: 0 }}
              >
                {isMobileMenuOpen ? <X style={{ width: '22px', height: '22px' }} /> : <Menu style={{ width: '22px', height: '22px' }} />}
              </Button>
            </div>
          </div>
        </div>

        {/* PREMIUM MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-black/8 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActivePath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 font-semibold shadow-sm'
                        : 'hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Business Menu */}
              <div className="pt-4 mt-4 border-t border-black/8">
                <div className="text-xs font-bold text-gray-500 mb-3 px-4 tracking-wider">BUSINESS</div>
                {userBusinesses.length > 0 ? (
                  <>
                    <Link href={`/business/${userBusinesses[0].id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Building2 className="h-5 w-5" />
                      <span className="text-sm font-medium">View Profile</span>
                    </Link>
                    <Link href="/business-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-sm font-medium">Business Dashboard</span>
                    </Link>
                    <Link href="/marketing" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Marketing Hub</span>
                      <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">NEW</span>
                    </Link>
                    <Link href="/blog/manage" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Blog Manager</span>
                      <span className="ml-auto text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">NEW</span>
                    </Link>
                    <Link href="/social-hub" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Megaphone className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Social Media Hub</span>
                      <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                    </Link>
                    <Link href="/business-analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm font-medium">Business Analytics</span>
                    </Link>
                    <Link href="/spotlight/voting" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Trophy className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium">Vote</span>
                      <span className="ml-auto text-xs">🔥</span>
                    </Link>
                    <Link href="/loyalty" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Gift className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Rewards</span>
                      <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">NEW</span>
                    </Link>
                    <Link href="/vendor/products" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Package className="h-5 w-5" />
                      <span className="text-sm font-medium">Manage Products</span>
                    </Link>
                    <Link href="/vendor/payouts" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <ShoppingCart className="h-5 w-5" />
                      <span className="text-sm font-medium">Payouts & Billing</span>
                    </Link>
                  </>
                ) : (
                  <Link href="/create-business" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                    <Building2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Create Business</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Voice Shop Modal */}
      <VoiceShopModal open={voiceModalOpen} onOpenChange={setVoiceModalOpen} />
    </>
  );
}

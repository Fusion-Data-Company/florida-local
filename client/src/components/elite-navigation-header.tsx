import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, X, Home, MapPin, Store, MessageSquare, ShoppingCart, Package, Building2, ScrollText, Sparkles, Trophy, Users, Gift, Star, TrendingUp, BarChart3, Target, BookOpen, Monitor, Shield, Megaphone, Workflow, FileText, User, Briefcase, Rocket } from "lucide-react";
import { useState, useEffect } from "react";
import CartIcon from "@/components/cart-icon";
import NotificationCenter from "@/components/notification-center";
import { ConnectionIndicator } from "@/components/realtime/ConnectionIndicator";
import type { Business } from "@shared/types";
import { Link as WouterLink } from "wouter";

export default function EliteNavigationHeader() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    return location === path || location.startsWith(path);
  };

  // APPLE-STYLE NAVIGATION ITEMS - CLEAN & MINIMAL
  const navigationItems = [
    { href: "/", label: "Discover", icon: Home, testId: "nav-discover" },
    { href: "/marketplace", label: "Marketplace", icon: Store, testId: "nav-marketplace" },
    { href: "/community", label: "Community", icon: Users, testId: "nav-community" },
    { href: "/florida-local", label: "Florida Local", icon: MapPin, testId: "nav-florida-local" },
    { href: "/registry", label: "Registry", icon: ScrollText, testId: "nav-registry" },
    { href: "/ai/tools", label: "AI Tools", icon: Sparkles, testId: "nav-ai-tools" },
  ];

  return (
    <>
      {/* GREY MARBLE GLASS HEADER - APPLE STYLE */}
      <header className={`elite-glass-header sticky top-0 z-50 w-full ${scrolled ? 'scrolled' : ''}`}>
        <div className="container mx-auto px-6" style={{ position: 'relative', zIndex: 10 }}>
          <div className="flex items-center justify-between" style={{ height: '72px' }}>

            {/* FLORIDA LOCAL LOGO - ULTRA-ELITE TREATMENT */}
            <Link href="/" className="elite-logo-container flex items-center" data-testid="brand-logo">
              <div className="relative px-4 py-2 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}>
                <img 
                  src="/attached_assets/me_1760215801481.png" 
                  alt="The Florida Local" 
                  className="h-12 w-auto object-contain"
                  style={{ maxHeight: '48px', filter: 'drop-shadow(0 2px 8px rgba(251,191,36,0.3))' }}
                />
              </div>
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
                    >
                      <IconComponent />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* BUSINESS DROPDOWN - FIXED SIZE */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="elite-nav-item" style={{ gap: '6px' }}>
                    <Building2 style={{ width: '18px', height: '18px' }} />
                    <span>Business</span>
                    <ChevronDown style={{ width: '14px', height: '14px', marginLeft: '-2px' }} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="elite-glass-dropdown w-52">
                    {userBusinesses.length > 0 ? (
                      <>
                        {/* Profile Section */}
                        <div className="px-2 py-1 text-xs font-bold text-gray-500">PROFILES</div>
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
                        <div className="px-2 py-1 text-xs font-bold text-gray-500">MANAGEMENT</div>
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
            <div className="flex items-center" style={{ gap: '8px' }}>
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center" style={{ gap: '8px' }}>
                    <ConnectionIndicator />
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
                    <CartIcon />
                  </div>

                  {/* USER AVATAR - FIXED SIZE WITH METALLIC RING */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="rounded-full hover:bg-black/5 transition-all"
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: 0,
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                          boxShadow: '0 2px 8px rgba(6, 182, 212, 0.15), 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 0 12px rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <Avatar style={{ width: '32px', height: '32px' }}>
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-500 text-white" style={{ fontSize: '13px' }}>
                            {user?.firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="elite-glass-dropdown w-52">
                      {/* Personal Section */}
                      <div className="px-2 py-1 text-xs font-bold text-gray-500">PERSONAL</div>
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
                          <div className="px-2 py-1 text-xs font-bold text-gray-500">ADMIN</div>
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
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  className="rounded-lg"
                  style={{ height: '40px', padding: '0 20px', fontSize: '15px', fontWeight: 500 }}
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
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
    </>
  );
}

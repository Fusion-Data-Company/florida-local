import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, TreePine, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import CartIcon from "@/components/cart-icon";
import ThemeToggleButton from "@/components/theme-toggle-button";
import type { Business } from "@shared/types";

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

  // ELITE NAVIGATION ITEMS - CLEAN & INTEGRATED
  const navigationItems = [
    { href: "/", label: "Discover", icon: "✨", testId: "nav-discover" },
    { href: "/florida-elite", label: "Florida Elite", icon: "🏝️", testId: "nav-florida-elite" },
    { href: "/marketplace", label: "Marketplace", icon: "🏪", testId: "nav-marketplace" },
    { href: "/messages", label: "Messages", icon: "💬", testId: "nav-messages" },
    { href: "/cart", label: "Cart", icon: "🛒", testId: "nav-cart" },
    { href: "/orders", label: "Orders", icon: "📋", testId: "nav-orders" },
  ];

  return (
    <>
      {/* ELITE MARKETING FIRM HEADER */}
      <header className="elite-glass-header nav-marble-header sticky top-0 z-50 w-full">
        <div className="container mx-auto px-8 relative z-10">
          <div className="flex h-16 items-center justify-between relative z-10">
            
            {/* ELITE LOGO */}
            <Link href="/" className="elite-logo-container group relative z-10" data-testid="brand-logo">
              <div className="flex items-center space-x-4">
                <div className="elite-logo-icon relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <TreePine className="h-10 w-10 text-cyan-600 group-hover:text-cyan-500 transition-colors duration-300 relative z-10" />
                </div>
                <div>
                  <h1 className="elite-logo-text text-2xl">
                    Florida Local Elite
                  </h1>
                </div>
                {/* PREMIUM BADGE - SEPARATE BLOCK */}
                <div
                  className="relative px-4 py-2 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f093fb 100%)',
                    boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  {/* Glass shimmer effect */}
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(255,255,255,0.8) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s linear infinite'
                    }}
                  ></div>
                  <span className="relative z-10 text-xs font-black uppercase tracking-wider text-white drop-shadow-md">
                    Premium Business Network
                  </span>
                </div>
              </div>
            </Link>

            {/* ELITE NAVIGATION - SINGLE CLEAN MENU */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center space-x-2 relative z-10">
                {navigationItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`
                      elite-nav-item px-4 py-2 rounded-lg font-medium transition-all duration-300
                      flex items-center gap-2 group
                      ${isActivePath(item.href) 
                        ? 'elite-nav-active' 
                        : 'text-slate-700 hover:bg-white/30'
                      }
                    `}
                    data-testid={item.testId}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                
                {/* BUSINESS DROPDOWN INTEGRATED */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="elite-nav-item px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 group text-slate-700 hover:bg-white/30">
                    <span>🏢</span>
                    <span>Business</span>
                    <ChevronDown className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="elite-glass-dropdown w-56">
                    {userBusinesses.length > 0 ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/business/${userBusinesses[0].id}`} className="elite-dropdown-item">
                            👁️ <span>View Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/business/${userBusinesses[0].id}/edit`} className="elite-dropdown-item">
                            ✏️ <span>Edit Business</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/products" className="elite-dropdown-item">
                            📦 <span>Manage Products</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/payouts" className="elite-dropdown-item">
                            💰 <span>Payouts & Billing</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="elite-dropdown-separator" />
                        <DropdownMenuItem asChild>
                          <Link href="/create-business" className="elite-dropdown-item">
                            ➕ <span>Create Another</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/create-business" className="elite-dropdown-item">
                          ➕ <span>Create Business</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            )}

            {/* ELITE USER MENU */}
            <div className="flex items-center space-x-4 relative z-10">
              {isAuthenticated ? (
                <>
                  <ThemeToggleButton />
                  <CartIcon />
                  
                  {/* ELITE USER AVATAR - NO MORE SHIT BADGE */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="elite-user-avatar-container group">
                        <div className="elite-user-avatar">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.profileImageUrl || undefined} />
                            <AvatarFallback className="elite-avatar-fallback">
                              {user?.firstName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="hidden md:flex flex-col items-start ml-3">
                          <span className="elite-user-name">
                            {user?.firstName} {user?.lastName}
                          </span>
                          <span className="elite-user-status">
                            Premium Member
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="elite-glass-dropdown w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="elite-dropdown-item">
                          👤 <span>Profile Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="elite-dropdown-separator" />
                      <DropdownMenuItem asChild>
                        <a href="/api/logout" className="elite-dropdown-item text-red-600">
                          🚪 <span>Sign Out</span>
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/api/login'} 
                  className="btn-luxury-signin px-8 py-2.5 relative z-10"
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
              )}

              {/* MOBILE MENU TOGGLE */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/30"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* ELITE MOBILE MENU */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="lg:hidden elite-glass-mobile-menu nav-marble-mobile-menu relative z-10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <nav className="container mx-auto px-8 py-6 space-y-2 relative z-10">
                {navigationItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="elite-mobile-nav-item"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                
                {/* Mobile Business Menu */}
                <div className="pt-4 border-t border-white/20">
                  <div className="text-sm font-semibold text-slate-600 mb-2">Business</div>
                  {userBusinesses.length > 0 ? (
                    <>
                      <Link href={`/business/${userBusinesses[0].id}`} className="elite-mobile-nav-item">
                        👁️ <span>View Profile</span>
                      </Link>
                      <Link href={`/business/${userBusinesses[0].id}/edit`} className="elite-mobile-nav-item">
                        ✏️ <span>Edit Business</span>
                      </Link>
                      <Link href="/vendor/products" className="elite-mobile-nav-item">
                        📦 <span>Manage Products</span>
                      </Link>
                      <Link href="/vendor/payouts" className="elite-mobile-nav-item">
                        💰 <span>Payouts & Billing</span>
                      </Link>
                    </>
                  ) : (
                    <Link href="/create-business" className="elite-mobile-nav-item">
                      ➕ <span>Create Business</span>
                    </Link>
                  )}
                </div>
              </nav>
            </div>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </>
        )}
      </header>
    </>
  );
}

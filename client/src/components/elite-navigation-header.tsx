import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, TreePine, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import CartIcon from "@/components/cart-icon";
import type { Business } from "@shared/schema";

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
    { href: "/marketplace", label: "Marketplace", icon: "🏪", testId: "nav-marketplace" },
    { href: "/messages", label: "Messages", icon: "💬", testId: "nav-messages" },
    { href: "/cart", label: "Cart", icon: "🛒", testId: "nav-cart" },
    { href: "/orders", label: "Orders", icon: "📋", testId: "nav-orders" },
  ];

  return (
    <>
      {/* ELITE MARKETING FIRM HEADER */}
      <header className="elite-glass-header sticky top-0 z-50 w-full">
        <div className="container mx-auto px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* ELITE LOGO */}
            <Link href="/" className="elite-logo-container group" data-testid="brand-logo">
              <div className="flex items-center space-x-3">
                <div className="elite-logo-icon">
                  <TreePine className="h-8 w-8 text-cyan-600 group-hover:text-cyan-500 transition-colors duration-300" />
                </div>
                <div>
                  <h1 className="elite-logo-text">
                    Florida Local Elite
                  </h1>
                  <p className="elite-logo-subtitle">Premium Business Network</p>
                </div>
              </div>
            </Link>

            {/* ELITE NAVIGATION - SINGLE CLEAN MENU */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center space-x-2">
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
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <CartIcon />
                  
                  {/* ELITE USER AVATAR - NO MORE SHIT BADGE */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="elite-user-avatar-container group">
                        <div className="elite-user-avatar">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.profileImageUrl} />
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
                  className="btn-miami-primary px-6 py-2 font-semibold"
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
              className="lg:hidden elite-glass-mobile-menu"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <nav className="container mx-auto px-8 py-6 space-y-2">
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

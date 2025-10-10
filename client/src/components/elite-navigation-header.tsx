import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, TreePine, Menu, X, Home, MapPin, Store, MessageSquare, ShoppingCart, Package, Building2 } from "lucide-react";
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

  // APPLE-STYLE NAVIGATION ITEMS - CLEAN & MINIMAL
  const navigationItems = [
    { href: "/", label: "Discover", icon: Home, testId: "nav-discover" },
    { href: "/florida-elite", label: "Florida", icon: MapPin, testId: "nav-florida-elite" },
    { href: "/marketplace", label: "Marketplace", icon: Store, testId: "nav-marketplace" },
    { href: "/messages", label: "Messages", icon: MessageSquare, testId: "nav-messages" },
    { href: "/orders", label: "Orders", icon: Package, testId: "nav-orders" },
  ];

  return (
    <>
      {/* APPLE-STYLE ULTRA ELITE HEADER */}
      <header className={`elite-glass-header sticky top-0 z-50 w-full ${scrolled ? 'scrolled' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center justify-between">

            {/* PREMIUM LOGO WITH REFINED STYLING */}
            <Link href="/" className="elite-logo-container flex items-center gap-2 group" data-testid="brand-logo">
              <div className="elite-logo-icon flex items-center justify-center">
                <TreePine className="h-5 w-5 text-cyan-600" strokeWidth={2.5} />
              </div>
              <h1 className="elite-logo-text hidden md:block">
                Florida Local Elite
              </h1>
              <h1 className="elite-logo-text md:hidden">
                FL Elite
              </h1>
              {/* Premium Badge on Hover */}
              <span className="hidden lg:inline-block opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
                Premium
              </span>
            </Link>

            {/* APPLE-STYLE NAVIGATION - MINIMAL & CLEAN */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`elite-nav-item flex items-center gap-1.5 ${isActivePath(item.href) ? 'elite-nav-active' : ''}`}
                      data-testid={item.testId}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* BUSINESS DROPDOWN */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="elite-nav-item flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span>Business</span>
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="elite-glass-dropdown w-52">
                    {userBusinesses.length > 0 ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/business/${userBusinesses[0].id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/business/${userBusinesses[0].id}/edit`}>Edit Business</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/products">Manage Products</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/payouts">Payouts & Billing</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

            {/* APPLE-STYLE USER MENU - MINIMAL */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center gap-2">
                    <ThemeToggleButton />
                    <CartIcon />
                  </div>

                  {/* APPLE-STYLE USER AVATAR */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-1 rounded-full h-auto hover:opacity-80">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                            {user?.firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="elite-glass-dropdown w-52">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile Settings</Link>
                      </DropdownMenuItem>
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
                  size="sm"
                  className="h-8 px-4 text-sm"
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
                className="lg:hidden p-2 h-8 w-8"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                    <Link href={`/business/${userBusinesses[0].id}/edit`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                      <Building2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Edit Business</span>
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

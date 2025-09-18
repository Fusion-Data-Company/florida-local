import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Store, ChevronDown, Search, Bell, MessageCircle, Menu, X, TreePine, Edit, Package, User, LogOut } from "lucide-react";
import { useState } from "react";
import CartIcon from "@/components/cart-icon";
import type { Business } from "@shared/schema";

export default function NavigationHeader() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  // Fetch user businesses to show appropriate business nav
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search navigation
      console.log('Searching for:', searchQuery);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-50 w-full premium-nav-glass border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex h-20 items-center justify-between relative">
            
            {/* Elite Brand Logo Section */}
            <Link href="/" className="elite-brand-container group" data-testid="brand-logo">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <TreePine className="text-4xl text-slate-700 group-hover:text-secondary transition-all duration-500 group-hover:scale-105" size={32} />
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="elite-logo-text group-hover:scale-105 transition-transform duration-500">
                    Florida Local
                  </h1>
                  <p className="elite-subtitle-text">
                    Elite
                  </p>
                </div>
              </div>
            </Link>

            {/* Premium Desktop Navigation */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center space-x-2">
                <Link 
                  href="/" 
                  className={`premium-nav-link ${isActivePath('/') ? 'active' : ''}`}
                  data-testid="nav-discover"
                >
                  <span className="relative z-10 font-medium">Discover</span>
                </Link>
                
                <Link 
                  href="/marketplace" 
                  className={`premium-nav-link ${isActivePath('/marketplace') ? 'active' : ''}`}
                  data-testid="nav-marketplace"
                >
                  <span className="relative z-10 font-medium">Marketplace</span>
                </Link>
                
                {/* Premium Business Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="premium-nav-link group" data-testid="nav-business-dropdown">
                    <Store className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10 font-medium">Business</span>
                    <ChevronDown className="h-3 w-3 ml-1 group-hover:rotate-180 transition-transform duration-300" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 premium-dropdown">
                    {userBusinesses.length > 0 ? (
                      <>
                        <DropdownMenuItem asChild className="premium-dropdown-item">
                          <Link href={`/business/${userBusinesses[0].id}`}>
                            <Store className="h-4 w-4 mr-3" />
                            <span data-testid="link-my-business">My Business</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="premium-dropdown-item">
                          <Link href={`/business/${userBusinesses[0].id}/edit`}>
                            <Edit className="h-4 w-4 mr-3" />
                            <span data-testid="link-edit-business">Edit Business</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="premium-dropdown-item">
                          <Link href="/vendor/products">
                            <Package className="h-4 w-4 mr-3" />
                            <span data-testid="link-vendor-products">Manage Products</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2 border-border/30" />
                        <DropdownMenuItem asChild className="premium-dropdown-item">
                          <Link href="/create-business">
                            <Plus className="h-4 w-4 mr-3" />
                            <span data-testid="link-create-another-business">Create Another</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild className="premium-dropdown-item">
                        <Link href="/create-business">
                          <Plus className="h-4 w-4 mr-3" />
                          <span data-testid="link-create-business">Create Business</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link 
                  href="/messages" 
                  className={`premium-nav-link ${isActivePath('/messages') ? 'active' : ''}`}
                  data-testid="nav-network"
                >
                  <span className="relative z-10 font-medium">Network</span>
                </Link>
              </nav>
            )}

            {/* Premium Search and Actions Section */}
            <div className="flex items-center space-x-4">
              
              {/* Premium Search Bar - Desktop Only */}
              {isAuthenticated && (
                <form onSubmit={handleSearch} className="hidden lg:block">
                  <div className="premium-search-container">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="search" 
                      placeholder="Search businesses, products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="premium-search-input w-72"
                      data-testid="input-search-header"
                    />
                  </div>
                </form>
              )}

              {isAuthenticated ? (
                <>
                  {/* Premium Action Buttons */}
                  <div className="hidden md:flex items-center space-x-3">
                    
                    {/* Cart Icon with Premium Styling */}
                    <div className="premium-action-btn relative group">
                      <CartIcon />
                    </div>

                    {/* Premium Notifications */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="premium-action-btn relative group" 
                      data-testid="button-notifications"
                    >
                      <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <div className="premium-notification-badge"></div>
                    </Button>

                    {/* Premium Messages */}
                    <Link href="/messages">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="premium-action-btn relative group" 
                        data-testid="button-messages-nav"
                      >
                        <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                        <div className="premium-notification-badge"></div>
                      </Button>
                    </Link>
                  </div>

                  {/* Premium User Profile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="premium-profile-btn group" 
                        data-testid="button-user-menu"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9 premium-avatar">
                            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-foreground font-semibold text-sm">
                              {user?.firstName?.[0]}{user?.lastName?.[0] || <User className="text-sm" size={12} />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden xl:block text-left">
                            <p className="text-sm font-semibold text-luxury leading-tight">
                              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {user?.email}
                            </p>
                          </div>
                          <ChevronDown className="h-3 w-3 ml-1 group-hover:rotate-180 transition-transform duration-300" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 premium-dropdown" align="end" forceMount>
                      <div className="px-4 py-3 border-b border-border/20">
                        <p className="text-sm font-semibold text-luxury">
                          {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                      <DropdownMenuItem asChild className="premium-dropdown-item">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => window.location.href = '/api/logout'}
                          data-testid="button-logout"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          <span>Sign Out</span>
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden premium-action-btn"
                    onClick={toggleMobileMenu}
                    data-testid="button-mobile-menu"
                  >
                    <div className={`premium-hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </Button>

                </>
              ) : (
                <Button asChild className="premium-profile-btn group font-semibold shadow-sm hover:shadow-md transition-shadow duration-300" data-testid="button-login">
                  <Link href="/api/login">
                    <span className="relative z-10">Sign In</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Premium Mobile Menu Overlay */}
      <div 
        className={`premium-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Premium Mobile Menu */}
      <div className={`premium-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="elite-brand-container">
            <div className="flex items-center space-x-3">
              <TreePine className="text-2xl text-slate-700" size={24} />
              <div>
                <h2 className="elite-logo-text text-lg">Florida Local</h2>
                <p className="elite-subtitle-text text-xs">Elite</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="premium-action-btn"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {isAuthenticated && (
          <>
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="premium-search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="search" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="premium-search-input"
                  data-testid="input-search-mobile"
                />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <nav className="space-y-2 mb-8">
              <Link 
                href="/" 
                className={`premium-nav-link block w-full ${isActivePath('/') ? 'active' : ''}`}
                onClick={closeMobileMenu}
                data-testid="mobile-nav-discover"
              >
                Discover
              </Link>
              <Link 
                href="/marketplace" 
                className={`premium-nav-link block w-full ${isActivePath('/marketplace') ? 'active' : ''}`}
                onClick={closeMobileMenu}
                data-testid="mobile-nav-marketplace"
              >
                Marketplace
              </Link>
              <Link 
                href="/messages" 
                className={`premium-nav-link block w-full ${isActivePath('/messages') ? 'active' : ''}`}
                onClick={closeMobileMenu}
                data-testid="mobile-nav-network"
              >
                Network
              </Link>
            </nav>

            {/* Mobile Business Section */}
            <div className="border-t border-border/20 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-luxury mb-4">Business</h3>
              <div className="space-y-2">
                {userBusinesses.length > 0 ? (
                  <>
                    <Link 
                      href={`/business/${userBusinesses[0].id}`}
                      className="premium-dropdown-item block w-full"
                      onClick={closeMobileMenu}
                      data-testid="mobile-link-my-business"
                    >
                      <Store className="h-4 w-4 mr-3 inline" />
                      My Business
                    </Link>
                    <Link 
                      href={`/business/${userBusinesses[0].id}/edit`}
                      className="premium-dropdown-item block w-full"
                      onClick={closeMobileMenu}
                      data-testid="mobile-link-edit-business"
                    >
                      <Edit className="h-4 w-4 mr-3 inline" />
                      Edit Business
                    </Link>
                    <Link 
                      href="/vendor/products"
                      className="premium-dropdown-item block w-full"
                      onClick={closeMobileMenu}
                      data-testid="mobile-link-vendor-products"
                    >
                      <Package className="h-4 w-4 mr-3 inline" />
                      Manage Products
                    </Link>
                    <Link 
                      href="/create-business"
                      className="premium-dropdown-item block w-full"
                      onClick={closeMobileMenu}
                      data-testid="mobile-link-create-another-business"
                    >
                      <Plus className="h-4 w-4 mr-3 inline" />
                      Create Another
                    </Link>
                  </>
                ) : (
                  <Link 
                    href="/create-business"
                    className="premium-dropdown-item block w-full"
                    onClick={closeMobileMenu}
                    data-testid="mobile-link-create-business"
                  >
                    <Plus className="h-4 w-4 mr-3 inline" />
                    Create Business
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex justify-around border-t border-border/20 pt-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="premium-action-btn flex-col h-auto py-3"
                data-testid="mobile-button-notifications"
              >
                <Bell className="h-5 w-5 mb-1" />
                <span className="text-xs">Notifications</span>
              </Button>
              <Link href="/messages" onClick={closeMobileMenu}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="premium-action-btn flex-col h-auto py-3"
                  data-testid="mobile-button-messages"
                >
                  <MessageCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Messages</span>
                </Button>
              </Link>
              <div className="premium-action-btn flex-col items-center py-3">
                <CartIcon />
                <span className="text-xs mt-1">Cart</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
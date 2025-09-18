import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Store, ChevronDown } from "lucide-react";
import { useState } from "react";
import CartIcon from "@/components/cart-icon";
import type { Business } from "@shared/schema";

export default function NavigationHeader() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/20 backdrop-blur-lg">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between relative">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <i className="fas fa-palm-tree text-3xl neon-cyan neon-glow transition-all duration-300 group-hover:scale-110"></i>
              <div className="absolute inset-0 neon-cyan opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold metallic gradient-text-gold text-luxury font-serif group-hover:scale-105 transition-transform duration-300">
                Florida Local
              </h1>
              <p className="text-xs gradient-text-cyan font-medium tracking-wider uppercase">
                Elite
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="relative group text-foreground hover:text-primary transition-all duration-300 text-luxury" data-testid="nav-home">
                <span className="relative z-10">Discover</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -m-2"></div>
              </Link>
              <Link href="/marketplace" className="relative group text-foreground hover:text-primary transition-all duration-300 text-luxury" data-testid="nav-marketplace">
                <span className="relative z-10">Marketplace</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -m-2"></div>
              </Link>
              
              {/* Business Navigation */}
              <DropdownMenu>
                <DropdownMenuTrigger className="relative group flex items-center space-x-2 text-foreground hover:text-primary transition-all duration-300 text-luxury" data-testid="nav-business-dropdown">
                  <Store className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Business</span>
                  <ChevronDown className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -m-2"></div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 glass-panel border-border/20">
                  {userBusinesses.length > 0 ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/business/${userBusinesses[0].id}`}>
                          <Store className="h-4 w-4 mr-2" />
                          <span data-testid="link-my-business">My Business</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/business/${userBusinesses[0].id}/edit`}>
                          <i className="fas fa-edit w-4 h-4 mr-2 flex items-center justify-center"></i>
                          <span data-testid="link-edit-business">Edit Business</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/products">
                          <i className="fas fa-box w-4 h-4 mr-2 flex items-center justify-center"></i>
                          <span data-testid="link-vendor-products">Manage Products</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/create-business">
                          <Plus className="h-4 w-4 mr-2" />
                          <span data-testid="link-create-another-business">Create Another</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/create-business">
                        <Plus className="h-4 w-4 mr-2" />
                        <span data-testid="link-create-business">Create Business</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/messages" className="relative group text-foreground hover:text-primary transition-all duration-300 text-luxury" data-testid="nav-messages">
                <span className="relative z-10">Network</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -m-2"></div>
              </Link>
              <Link href="/spotlight" className="relative group text-foreground hover:text-primary transition-all duration-300 text-luxury" data-testid="nav-spotlight">
                <span className="relative z-10">Spotlight</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -m-2"></div>
              </Link>
            </nav>
          )}

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4 relative">
            {/* Search */}
            {isAuthenticated && (
              <form onSubmit={handleSearch} className="hidden md:block relative group">
                <Input 
                  type="search" 
                  placeholder="Search businesses, products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 glass-panel border-border/30 bg-background/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                  data-testid="input-search-header"
                />
                <i className="fas fa-search absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors duration-300"></i>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </form>
            )}

            {isAuthenticated ? (
              <>
                {/* Cart Icon */}
                <div className="relative group">
                  <CartIcon />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative group hover-lift" data-testid="button-notifications">
                  <i className="fas fa-bell text-lg group-hover:scale-110 transition-transform duration-300"></i>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse glow-accent"></span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                </Button>

                {/* Messages */}
                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="relative group hover-lift" data-testid="button-messages-nav">
                    <i className="fas fa-comment text-lg group-hover:scale-110 transition-transform duration-300"></i>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse glow-secondary"></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                  </Button>
                </Link>

                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-auto px-3 rounded-full group hover-lift card-rim-light" data-testid="button-user-menu">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300">
                          <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-medium">
                            {user?.firstName?.[0]}{user?.lastName?.[0] || <i className="fas fa-user text-sm"></i>}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block text-sm font-medium text-luxury">
                          {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-panel border-border/20" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start hover-lift"
                        onClick={() => window.location.href = '/api/logout'}
                        data-testid="button-logout"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        <span>Sign Out</span>
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild variant="default" className="metallic hover-lift btn-press glow-secondary group" data-testid="button-login">
                <Link href="/api/login">
                  <span className="relative z-10 font-semibold">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
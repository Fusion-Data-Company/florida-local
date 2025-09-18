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

export default function NavigationHeader() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user businesses to show appropriate business nav
  const { data: userBusinesses = [] } = useQuery({
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
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <i className="fas fa-palm-tree text-2xl text-primary"></i>
            <div>
              <h1 className="text-xl font-bold gradient-text">Florida Local</h1>
              <p className="text-xs text-muted-foreground">Elite</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="nav-home">
                Discover
              </Link>
              <Link href="/marketplace" className="text-foreground hover:text-primary transition-colors" data-testid="nav-marketplace">
                Marketplace
              </Link>
              
              {/* Business Navigation */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors" data-testid="nav-business-dropdown">
                  <Store className="h-4 w-4" />
                  <span>Business</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
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

              <Link href="/messages" className="text-foreground hover:text-primary transition-colors" data-testid="nav-messages">
                Network
              </Link>
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer">
                Spotlight
              </span>
            </nav>
          )}

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {isAuthenticated && (
              <form onSubmit={handleSearch} className="hidden md:block relative">
                <Input 
                  type="search" 
                  placeholder="Search businesses, products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                  data-testid="input-search-header"
                />
                <i className="fas fa-search absolute left-3 top-3 text-muted-foreground"></i>
              </form>
            )}

            {isAuthenticated ? (
              <>
                {/* Cart Icon */}
                <CartIcon />

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                  <i className="fas fa-bell text-lg"></i>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
                </Button>

                {/* Messages */}
                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-messages-nav">
                    <i className="fas fa-comment text-lg"></i>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></span>
                  </Button>
                </Link>

                {/* User Profile */}
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      <i className="fas fa-user text-sm"></i>
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-logout"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => window.location.href = '/api/login'} data-testid="button-login">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

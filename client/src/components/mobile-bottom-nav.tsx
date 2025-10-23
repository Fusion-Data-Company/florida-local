import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Home, ShoppingBag, Store, Plus, MessageSquare } from "lucide-react";
import { type Business } from "@shared/types";

// Define nav item type
type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  testId: string;
  hasNotification?: boolean;
};

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  // Fetch user businesses to show appropriate business nav
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const businessNavItem: NavItem = userBusinesses.length > 0
    ? { href: `/business/${userBusinesses[0].id}`, icon: <Store size={18} />, label: "My Biz", testId: "nav-mobile-my-business" }
    : { href: "/create-business", icon: <Plus size={18} />, label: "Create", testId: "nav-mobile-create-business" };

  const navItems: NavItem[] = [
    { href: "/", icon: <Home size={18} />, label: "Home", testId: "nav-mobile-home" },
    { href: "/marketplace", icon: <ShoppingBag size={18} />, label: "Shop", testId: "nav-mobile-marketplace" },
    businessNavItem,
    { href: "/messages", icon: <MessageSquare size={18} />, label: "Messages", testId: "nav-mobile-messages", hasNotification: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 premium-mobile-nav nav-marble-mobile-bottom glass-panel border-t border-border/30 backdrop-blur-xl md:hidden z-40">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <div className="flex items-center justify-around py-3">
        {navItems.map((item) => {
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center p-3 relative rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'text-primary metallic shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
              data-testid={item.testId}
            >
              <div className="mb-1 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <span className="text-xs font-medium relative z-10">{item.label}</span>
              {item.hasNotification && (
                <div className="absolute -top-1 -right-1 premium-notification-pulse">
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-20"></div>
                </div>
              )}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl"></div>
              )}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

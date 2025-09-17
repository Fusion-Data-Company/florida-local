import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { type Business } from "@shared/schema";

// Define nav item type
type NavItem = {
  href: string;
  icon: string;
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
    ? { href: `/business/${userBusinesses[0].id}`, icon: "fas fa-store", label: "My Biz", testId: "nav-mobile-my-business" }
    : { href: "/create-business", icon: "fas fa-plus-circle", label: "Create", testId: "nav-mobile-create-business" };

  const navItems: NavItem[] = [
    { href: "/", icon: "fas fa-home", label: "Home", testId: "nav-mobile-home" },
    { href: "/marketplace", icon: "fas fa-shopping-bag", label: "Shop", testId: "nav-mobile-marketplace" },
    businessNavItem,
    { href: "/messages", icon: "fas fa-comment", label: "Messages", testId: "nav-mobile-messages", hasNotification: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center p-2 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              data-testid={item.testId}
            >
              <i className={`${item.icon} text-lg mb-1`}></i>
              <span className="text-xs">{item.label}</span>
              {item.hasNotification && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

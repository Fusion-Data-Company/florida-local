import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home", testId: "nav-mobile-home" },
    { href: "/marketplace", icon: "fas fa-shopping-bag", label: "Shop", testId: "nav-mobile-marketplace" },
    { href: "/messages", icon: "fas fa-comment", label: "Messages", testId: "nav-mobile-messages", hasNotification: true },
    { href: "/profile", icon: "fas fa-user", label: "Profile", testId: "nav-mobile-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <button 
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
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

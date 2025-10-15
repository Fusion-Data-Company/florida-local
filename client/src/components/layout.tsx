import EliteNavigationHeader from "@/components/elite-navigation-header";
import LuxuryFooter from "@/components/luxury-footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showMobileNav?: boolean;
}

export default function Layout({ children, showFooter = true, showMobileNav = true }: LayoutProps) {
  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light flex flex-col"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >
      <EliteNavigationHeader />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <LuxuryFooter />}
      {showMobileNav && <MobileBottomNav />}
    </div>
  );
}

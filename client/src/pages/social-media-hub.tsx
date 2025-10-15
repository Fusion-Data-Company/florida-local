import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SocialMediaHubEnhanced from "@/components/social-media-hub-enhanced";
import { AbstractBackground } from "@/components/ui/abstract-background";

export default function SocialMediaHub() {
  return (
    <AbstractBackground backgroundKey="bubbles1" overlay="medium" className="min-h-screen">
      <EliteNavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <SocialMediaHubEnhanced />
      </div>

      <MobileBottomNav />
    </AbstractBackground>
  );
}
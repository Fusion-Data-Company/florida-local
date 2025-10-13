import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SocialMediaHubEnhanced from "@/components/social-media-hub-enhanced";

export default function SocialMediaHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <EliteNavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <SocialMediaHubEnhanced />
      </div>

      <MobileBottomNav />
    </div>
  );
}
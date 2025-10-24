import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp } from "lucide-react";
import PlatformAnalyticsDashboard from "@/components/platform-analytics-dashboard";
import { Link as WouterLink, useLocation } from "wouter";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Check if user is admin
  // Note: In a real app, you would have proper admin role checking
  const isAdmin = user?.id === "1" || user?.username === "admin"; // Simple check for demo

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-red-600" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white py-6 shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100">Platform Analytics & Insights</p>
              </div>
            </div>
            <WouterLink href="/">
              <Button variant="secondary">
                Back to Home
              </Button>
            </WouterLink>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <PlatformAnalyticsDashboard />
      </div>
    </div>
  );
}

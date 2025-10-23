import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Building2, 
  Shield, 
  Award, 
  Briefcase, 
  Store, 
  Settings, 
  LogOut,
  ChevronRight,
  Crown,
  Star,
  TrendingUp,
  Package,
  MessageSquare,
  Heart
} from "lucide-react";
import type { Business } from "@shared/types";

interface UserProfileData {
  user: any;
  businesses: Business[];
  loyaltyAccount: any;
  stats: {
    totalOrders: number;
    totalSpent: number;
    totalProducts: number;
    totalPosts: number;
    totalFollowing: number;
  };
}

export default function UserProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  // Fetch user businesses
  const { data: userBusinesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  // Fetch loyalty account
  const { data: loyaltyAccount, isLoading: loyaltyLoading } = useQuery<any>({
    queryKey: ['/api/loyalty/account'],
    enabled: isAuthenticated,
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/user/stats'],
    enabled: isAuthenticated,
  });

  // Show profile after authentication is confirmed
  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    // If not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      window.location.href = '/api/login';
      return;
    }
    
    // If authenticated and data is loaded, show the profile
    if (isAuthenticated && !businessesLoading && !loyaltyLoading) {
      setShowProfile(true);
    }
  }, [authLoading, isAuthenticated, businessesLoading, loyaltyLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <h2 className="text-xl font-semibold">Verifying authentication...</h2>
                <p className="text-gray-900">Please wait while we verify your session</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading while fetching user data
  if (!showProfile || businessesLoading || loyaltyLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <h2 className="text-xl font-semibold">Loading your profile...</h2>
                <p className="text-gray-900">Setting up your personalized dashboard</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Manual profile view (if user navigates back or wants to see overview)
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="flex items-start gap-6">
              {/* Profile Image */}
              <div className="relative">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || "User"}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}
                {user?.isAdmin && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  {user?.isAdmin && (
                    <Badge variant="secondary" className="bg-yellow-100">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {userBusinesses.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100">
                      <Building2 className="h-3 w-3 mr-1" />
                      Business Owner
                    </Badge>
                  )}
                </div>
                <p className="text-gray-900 mb-4">{user?.email}</p>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 text-sm">
                  {userBusinesses.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>{userBusinesses.length} Business{userBusinesses.length > 1 ? 'es' : ''}</span>
                    </div>
                  )}
                  {loyaltyAccount && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span>{loyaltyAccount.currentPoints || 0} Points</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Admin Dashboard */}
          {user?.isAdmin && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate("/admin")}
              data-testid="card-admin-dashboard"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>Manage platform and users</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Go to Admin Panel
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Business Dashboard */}
          {userBusinesses.length > 0 && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate("/business-dashboard")}
              data-testid="card-business-dashboard"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Business Dashboard
                </CardTitle>
                <CardDescription>Manage your businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {userBusinesses.slice(0, 2).map((business) => (
                    <div key={business.id} className="text-sm">
                      • {business.name}
                    </div>
                  ))}
                  {userBusinesses.length > 2 && (
                    <div className="text-sm text-gray-900">
                      +{userBusinesses.length - 2} more
                    </div>
                  )}
                </div>
                <Button className="w-full" variant="outline">
                  Manage Businesses
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create Business */}
          {userBusinesses.length === 0 && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate("/create-business")}
              data-testid="card-create-business"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-green-500" />
                  Start Your Business
                </CardTitle>
                <CardDescription>Create your business profile</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Create Business
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loyalty Program */}
          {loyaltyAccount && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate("/loyalty")}
              data-testid="card-loyalty"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Loyalty Program
                </CardTitle>
                <CardDescription>
                  {loyaltyAccount.tierName || 'Bronze'} Member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {loyaltyAccount.currentPoints || 0} Points
                </div>
                <Button className="w-full" variant="outline">
                  View Rewards
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Marketplace */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/marketplace")}
            data-testid="card-marketplace"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-500" />
                Marketplace
              </CardTitle>
              <CardDescription>Browse products & services</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Browse Marketplace
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/messages")}
            data-testid="card-messages"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-500" />
                Messages
              </CardTitle>
              <CardDescription>View your conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Open Messages
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700"
              onClick={() => window.location.href = "/api/logout"}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
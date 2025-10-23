import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, TrendingUp, Plus } from "lucide-react";
import { Link as WouterLink, useLocation } from "wouter";
import { useState } from "react";
import BusinessAnalyticsDashboard from "@/components/business-analytics-dashboard";

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function BusinessAnalyticsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Fetch user's businesses
  const { data: businesses, isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/my-businesses"],
  });

  // Auto-select first business
  if (!selectedBusinessId && businesses && businesses.length > 0) {
    setSelectedBusinessId(businesses[0].id);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your businesses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center p-4 min-h-[80vh]">
          <Card className="max-w-md w-full bg-white/90 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Store className="h-8 w-8 text-blue-600" />
              <CardTitle>No Businesses Found</CardTitle>
            </div>
            <CardDescription>
              You need to create a business first to view analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WouterLink href="/create-business">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Business
              </Button>
            </WouterLink>
            <WouterLink href="/">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </WouterLink>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Business Analytics</h1>
                <p className="text-blue-100">Track your business performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {businesses.length > 1 && (
                <Select
                  value={selectedBusinessId || ""}
                  onValueChange={setSelectedBusinessId}
                >
                  <SelectTrigger className="w-[250px] bg-white text-gray-900">
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <WouterLink href="/">
                <Button variant="secondary">
                  Back to Home
                </Button>
              </WouterLink>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {selectedBusinessId ? (
          <BusinessAnalyticsDashboard businessId={selectedBusinessId} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Select a business to view analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}

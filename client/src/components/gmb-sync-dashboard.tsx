import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, RefreshCw, Clock, MapPin, ExternalLink, Wifi, WifiOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface GMBSyncStatus {
  isConnected: boolean;
  businessName: string;
  locationId?: string;
  lastSyncedAt?: string;
  syncStatus: "synced" | "syncing" | "error" | "never";
  syncProgress?: number;
  autoPostEnabled: boolean;
  reviewSyncEnabled: boolean;
  photoSyncEnabled: boolean;
  errors?: string[];
  stats: {
    totalReviews: number;
    averageRating: number;
    photosCount: number;
    postsCount: number;
    viewsLastMonth: number;
    searchesLastMonth: number;
  };
}

interface GMBSyncDashboardProps {
  businessId: string;
  className?: string;
  compact?: boolean;
}

/**
 * GMB Sync Dashboard Component
 *
 * Displays Google My Business integration status, sync information,
 * and quick actions for managing GMB connection.
 *
 * @param businessId - The business to show GMB status for
 * @param className - Additional Tailwind classes
 * @param compact - Show compact view (default: false)
 */
export default function GMBSyncDashboard({
  businessId,
  className = "",
  compact = false
}: GMBSyncDashboardProps) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch GMB sync status
  const { data: syncStatus, isLoading } = useQuery<GMBSyncStatus>({
    queryKey: ['/api/gmb/sync-status', businessId],
    queryFn: async () => {
      // TODO: Replace with actual API call when backend is ready
      // return fetch(`/api/gmb/sync-status/${businessId}`).then(res => res.json());

      // Mock data for now
      return {
        isConnected: true,
        businessName: "Miami Beach Boutique",
        locationId: "12345678901234567890",
        lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        syncStatus: "synced",
        autoPostEnabled: true,
        reviewSyncEnabled: true,
        photoSyncEnabled: false,
        stats: {
          totalReviews: 127,
          averageRating: 4.7,
          photosCount: 45,
          postsCount: 23,
          viewsLastMonth: 1245,
          searchesLastMonth: 892,
        },
      } as GMBSyncStatus;
    },
    enabled: Boolean(businessId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      // TODO: Implement actual sync API call
      // await fetch(`/api/gmb/sync/${businessId}`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSyncing(false);
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Google My Business data has been synced successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/sync-status', businessId] });
    },
    onError: () => {
      setIsSyncing(false);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Google My Business. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    // Redirect to GMB OAuth flow
    window.location.href = `/api/gmb/connect?businessId=${businessId}`;
  };

  const handleDisconnect = () => {
    // TODO: Implement disconnect
    toast({
      title: "Disconnected",
      description: "Google My Business has been disconnected.",
    });
  };

  if (isLoading) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus?.isConnected) {
    return (
      <Card className={`entrance-fade-up border-orange-200 bg-orange-50/50 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <CardTitle>Google My Business Not Connected</CardTitle>
          </div>
          <CardDescription>
            Connect your Google My Business account to unlock powerful features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Auto-sync reviews and ratings</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Post updates automatically</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Sync photos and media</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Track performance insights</span>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              className="w-full"
              size="lg"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Connect Google My Business
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                syncStatus.syncStatus === "synced" ? "bg-emerald-100" :
                syncStatus.syncStatus === "syncing" ? "bg-blue-100" :
                "bg-red-100"
              }`}>
                {syncStatus.syncStatus === "synced" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : syncStatus.syncStatus === "syncing" ? (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm">GMB Connected</h4>
                <p className="text-xs text-muted-foreground">
                  {syncStatus.lastSyncedAt && formatDistanceToNow(new Date(syncStatus.lastSyncedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full dashboard view
  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Google My Business
                {syncStatus.syncStatus === "synced" && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                    <Wifi className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{syncStatus.businessName}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
            {syncStatus.locationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://business.google.com/locations/${syncStatus.locationId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Last Synced</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {syncStatus.lastSyncedAt && formatDistanceToNow(new Date(syncStatus.lastSyncedAt), { addSuffix: true })}
            </span>
          </div>
          {syncStatus.syncStatus === "syncing" && syncStatus.syncProgress !== undefined && (
            <div className="space-y-2">
              <Progress value={syncStatus.syncProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Syncing data... {syncStatus.syncProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Sync Features */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Sync Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${
              syncStatus.autoPostEnabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Auto-Post</span>
                {syncStatus.autoPostEnabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.autoPostEnabled ? "Active" : "Disabled"}
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${
              syncStatus.reviewSyncEnabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Review Sync</span>
                {syncStatus.reviewSyncEnabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.reviewSyncEnabled ? "Active" : "Disabled"}
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${
              syncStatus.photoSyncEnabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Photo Sync</span>
                {syncStatus.photoSyncEnabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.photoSyncEnabled ? "Active" : "Disabled"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h4 className="text-sm font-semibold mb-3">GMB Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <div className="text-2xl font-bold text-blue-700">
                {syncStatus.stats.totalReviews}
              </div>
              <div className="text-xs text-blue-600 font-medium">Reviews</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50">
              <div className="text-2xl font-bold text-amber-700">
                {syncStatus.stats.averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-amber-600 font-medium">Rating</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
              <div className="text-2xl font-bold text-purple-700">
                {syncStatus.stats.photosCount}
              </div>
              <div className="text-xs text-purple-600 font-medium">Photos</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <div className="text-2xl font-bold text-emerald-700">
                {syncStatus.stats.postsCount}
              </div>
              <div className="text-xs text-emerald-600 font-medium">Posts</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50">
              <div className="text-2xl font-bold text-cyan-700">
                {syncStatus.stats.viewsLastMonth.toLocaleString()}
              </div>
              <div className="text-xs text-cyan-600 font-medium">Views (30d)</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100/50">
              <div className="text-2xl font-bold text-pink-700">
                {syncStatus.stats.searchesLastMonth.toLocaleString()}
              </div>
              <div className="text-xs text-pink-600 font-medium">Searches (30d)</div>
            </div>
          </div>
        </div>

        {/* Errors */}
        {syncStatus.errors && syncStatus.errors.length > 0 && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">Sync Errors</h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {syncStatus.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Zap className="w-4 h-4 mr-2" />
            Configure Sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-600 hover:text-red-700">
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

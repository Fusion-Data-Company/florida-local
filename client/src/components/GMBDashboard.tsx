import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Link2,
  Unlink,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import GMBReviewManager from './GMBReviewManager';
import GMBSyncControl from './GMBSyncControl';
import GMBInsightsViewer from './GMBInsightsViewer';

interface GMBDashboardProps {
  businessId: string;
  businessName: string;
}

export default function GMBDashboard({ businessId, businessName }: GMBDashboardProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch GMB status
  const { data: gmbStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/status'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/status`);
      if (!response.ok) throw new Error('Failed to fetch GMB status');
      return response.json();
    }
  });

  // Fetch GMB insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/insights'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/insights`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: gmbStatus?.isConnected
  });

  // Connect to GMB mutation
  const connectGMB = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/businesses/${businessId}/gmb/connect`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Google My Business',
        variant: 'destructive'
      });
    }
  });

  // Disconnect from GMB mutation
  const disconnectGMB = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/businesses/${businessId}/gmb/disconnect`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', businessId, 'gmb/status'] });
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from Google My Business'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect from GMB',
        variant: 'destructive'
      });
    }
  });

  // Sync data mutation
  const syncData = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/businesses/${businessId}/gmb/sync`, {
        method: 'POST',
        body: JSON.stringify({
          forceUpdate: true,
          syncPhotos: true,
          syncReviews: true,
          syncBusinessInfo: true,
          conflictResolution: 'merge'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', businessId] });
      toast({
        title: 'Sync Started',
        description: 'GMB data synchronization has started'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync GMB data',
        variant: 'destructive'
      });
    }
  });

  const getConnectionStatus = () => {
    if (statusLoading) return { icon: Clock, text: 'Checking...', color: 'text-gray-500' };
    if (!gmbStatus) return { icon: XCircle, text: 'Not Connected', color: 'text-gray-500' };
    if (gmbStatus.isVerified && gmbStatus.isConnected) {
      return { icon: CheckCircle2, text: 'Connected & Verified', color: 'text-green-600' };
    }
    if (gmbStatus.isConnected) {
      return { icon: AlertCircle, text: 'Connected (Unverified)', color: 'text-yellow-600' };
    }
    return { icon: XCircle, text: 'Not Connected', color: 'text-red-600' };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Google My Business Integration
              </CardTitle>
              <CardDescription>
                Manage your Google Business Profile for {businessName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${connectionStatus.color}`}>
                <ConnectionIcon className="w-5 h-5" />
                <span className="font-medium">{connectionStatus.text}</span>
              </div>
              {gmbStatus?.isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectGMB.mutate()}
                  disabled={disconnectGMB.isPending}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => connectGMB.mutate()}
                  disabled={connectGMB.isPending || isConnecting}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect GMB
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      {gmbStatus?.isConnected && insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">
                    {insights.metrics?.views?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Actions</p>
                  <p className="text-2xl font-bold">
                    {insights.metrics?.actions?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold">
                    {gmbStatus?.syncDetails?.reviewsCount || 0}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold">
                    {gmbStatus?.syncDetails?.averageRating?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {gmbStatus?.isConnected ? (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => syncData.mutate()}
                    disabled={syncData.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => setSelectedTab('reviews')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Manage Reviews
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => setSelectedTab('insights')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Insights
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sync Status Overview */}
            {gmbStatus?.syncDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Synced</span>
                      <span className="text-sm font-medium">
                        {gmbStatus.syncDetails.lastSync 
                          ? new Date(gmbStatus.syncDetails.lastSync).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                    {gmbStatus.syncDetails.syncProgress && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Sync Progress</span>
                            <span>{gmbStatus.syncDetails.syncProgress}%</span>
                          </div>
                          <Progress value={gmbStatus.syncDetails.syncProgress} />
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Business Info</span>
                        <Badge variant="outline" className="ml-2">
                          {gmbStatus.syncDetails.businessInfoSynced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reviews</span>
                        <Badge variant="outline" className="ml-2">
                          {gmbStatus.syncDetails.reviewsSynced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Photos</span>
                        <Badge variant="outline" className="ml-2">
                          {gmbStatus.syncDetails.photosSynced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Posts</span>
                        <Badge variant="outline" className="ml-2">
                          {gmbStatus.syncDetails.postsSynced ? 'Synced' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <GMBReviewManager businessId={businessId} />
          </TabsContent>

          <TabsContent value="insights">
            <GMBInsightsViewer businessId={businessId} />
          </TabsContent>

          <TabsContent value="sync">
            <GMBSyncControl businessId={businessId} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GMB Integration Settings</CardTitle>
                <CardDescription>
                  Configure how your business syncs with Google My Business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Changes to sync settings will take effect on the next sync cycle.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-sync</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync data every 6 hours
                      </p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Conflict Resolution</p>
                      <p className="text-sm text-muted-foreground">
                        How to handle data conflicts during sync
                      </p>
                    </div>
                    <Badge variant="outline">Merge</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Review Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you receive new reviews
                      </p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Connect to Google My Business</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Connect your Google Business Profile to manage reviews, posts, and insights directly from your dashboard.
              </p>
              <Button 
                onClick={() => connectGMB.mutate()}
                disabled={connectGMB.isPending || isConnecting}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Connect Google My Business
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
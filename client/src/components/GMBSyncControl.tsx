import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Settings2,
  Activity,
  Calendar,
  Database,
  FileSync,
  TrendingUp,
  Download,
  ChevronRight
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SyncSession {
  id: string;
  businessId: string;
  startTime: string;
  endTime?: string;
  status: 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  type: 'full' | 'incremental' | 'selective' | 'real-time';
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  dataChanges?: {
    businessInfo?: any[];
    reviews?: any[];
    posts?: any[];
    photos?: any[];
    insights?: any[];
  };
  errors: any[];
  warnings: string[];
  stats: {
    itemsProcessed: number;
    itemsCreated: number;
    itemsUpdated: number;
    itemsDeleted: number;
    itemsFailed: number;
    dataTransferred: number;
    apiCallsMade: number;
    duration: number;
  };
}

interface SyncConfig {
  syncType: 'full' | 'incremental' | 'selective' | 'real-time';
  autoSync: boolean;
  syncInterval?: number;
  conflictStrategy: 'local_wins' | 'gmb_wins' | 'merge' | 'manual' | 'newest_wins';
  dataTypes: {
    businessInfo: boolean;
    reviews: boolean;
    posts: boolean;
    photos: boolean;
    insights: boolean;
  };
  webhookEnabled: boolean;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
}

interface GMBSyncControlProps {
  businessId: string;
}

export default function GMBSyncControl({ businessId }: GMBSyncControlProps) {
  const { toast } = useToast();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [syncConfig, setSyncConfig] = useState<Partial<SyncConfig>>({
    syncType: 'incremental',
    autoSync: false,
    syncInterval: 60,
    conflictStrategy: 'merge',
    dataTypes: {
      businessInfo: true,
      reviews: true,
      posts: true,
      photos: true,
      insights: true
    },
    retryOnFailure: true,
    maxRetries: 3
  });

  // Get sync history
  const { data: syncHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/sync/history'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/sync/history?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch sync history');
      return response.json();
    }
  });

  // Get active sync session
  const { data: activeSession, refetch: refetchSession } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/sync/session', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;
      const response = await fetch(`/api/businesses/${businessId}/gmb/sync/session/${activeSessionId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!activeSessionId,
    refetchInterval: activeSessionId ? 2000 : false // Poll every 2 seconds when sync is active
  });

  // Get sync report
  const { data: syncReport } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/sync/report'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/sync/report`);
      if (!response.ok) throw new Error('Failed to fetch sync report');
      return response.json();
    }
  });

  // Configure sync mutation
  const configureSyncMutation = useMutation({
    mutationFn: async (config: Partial<SyncConfig>) => {
      return apiRequest(`/api/businesses/${businessId}/gmb/sync/configure`, {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Configuration Updated',
        description: 'Sync configuration has been updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Configuration Failed',
        description: error.message || 'Failed to update sync configuration',
        variant: 'destructive'
      });
    }
  });

  // Start sync mutation
  const startSyncMutation = useMutation({
    mutationFn: async (options: { type?: string; dataTypes?: any; force?: boolean }) => {
      return apiRequest(`/api/businesses/${businessId}/gmb/sync/start`, {
        method: 'POST',
        body: JSON.stringify(options)
      });
    },
    onSuccess: (session: SyncSession) => {
      setActiveSessionId(session.id);
      toast({
        title: 'Sync Started',
        description: 'Data synchronization has started'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to start sync',
        variant: 'destructive'
      });
    }
  });

  // Cancel sync mutation
  const cancelSyncMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest(`/api/businesses/${businessId}/gmb/sync/cancel/${sessionId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      setActiveSessionId(null);
      toast({
        title: 'Sync Cancelled',
        description: 'Synchronization has been cancelled'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel sync',
        variant: 'destructive'
      });
    }
  });

  // Update active session when sync completes
  useEffect(() => {
    if (activeSession && (activeSession.status === 'completed' || activeSession.status === 'failed')) {
      setActiveSessionId(null);
    }
  }, [activeSession]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Active Sync Session */}
      {activeSession && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Sync in Progress</p>
                <p className="text-sm text-muted-foreground">
                  {activeSession.type} sync • {activeSession.stats.itemsProcessed} items processed
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelSyncMutation.mutate(activeSession.id)}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
            <Progress value={activeSession.progress.percentage} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-1">
              {activeSession.progress.completed} of {activeSession.progress.total} completed
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Sync Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Sync Actions</CardTitle>
              <CardDescription>
                Start a synchronization session with predefined settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col"
                  onClick={() => startSyncMutation.mutate({ type: 'incremental' })}
                  disabled={!!activeSessionId || startSyncMutation.isPending}
                >
                  <RefreshCw className="w-5 h-5 mb-2" />
                  <span className="font-medium">Incremental Sync</span>
                  <span className="text-xs text-muted-foreground">Sync recent changes</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col"
                  onClick={() => startSyncMutation.mutate({ type: 'full', force: true })}
                  disabled={!!activeSessionId || startSyncMutation.isPending}
                >
                  <FileSync className="w-5 h-5 mb-2" />
                  <span className="font-medium">Full Sync</span>
                  <span className="text-xs text-muted-foreground">Sync all data</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col"
                  onClick={() => startSyncMutation.mutate({ 
                    type: 'selective',
                    dataTypes: { reviews: true, insights: true }
                  })}
                  disabled={!!activeSessionId || startSyncMutation.isPending}
                >
                  <Settings2 className="w-5 h-5 mb-2" />
                  <span className="font-medium">Custom Sync</span>
                  <span className="text-xs text-muted-foreground">Choose data types</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Statistics */}
          {syncReport && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Syncs</p>
                    <p className="text-2xl font-bold">{syncReport.totalSyncs}</p>
                    <p className="text-xs text-muted-foreground">
                      {syncReport.successfulSyncs} successful
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {syncReport.totalSyncs > 0 
                        ? Math.round((syncReport.successfulSyncs / syncReport.totalSyncs) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {syncReport.failedSyncs} failed
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(syncReport.averageDuration)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Data Transferred</p>
                    <p className="text-2xl font-bold">
                      {formatBytes(syncReport.totalDataTransferred)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Errors */}
          {syncReport?.recentErrors && syncReport.recentErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncReport.recentErrors.map((error: any, index: number) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium">{error.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {error.dataType} • {new Date(error.timestamp).toLocaleString()}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Configuration</CardTitle>
              <CardDescription>
                Configure how data is synchronized with Google My Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Type */}
              <div className="space-y-2">
                <Label>Sync Type</Label>
                <Select
                  value={syncConfig.syncType}
                  onValueChange={(value: any) => setSyncConfig({ ...syncConfig, syncType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incremental">Incremental (Changes only)</SelectItem>
                    <SelectItem value="full">Full (All data)</SelectItem>
                    <SelectItem value="selective">Selective (Choose data)</SelectItem>
                    <SelectItem value="real-time">Real-time (Continuous)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how data should be synchronized
                </p>
              </div>

              <Separator />

              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-sync">Automatic Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically sync data at regular intervals
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={syncConfig.autoSync}
                  onCheckedChange={(checked) => setSyncConfig({ ...syncConfig, autoSync: checked })}
                />
              </div>

              {syncConfig.autoSync && (
                <div className="space-y-2 pl-4">
                  <Label>Sync Interval (minutes)</Label>
                  <Select
                    value={syncConfig.syncInterval?.toString()}
                    onValueChange={(value) => setSyncConfig({ ...syncConfig, syncInterval: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="1440">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Conflict Strategy */}
              <div className="space-y-2">
                <Label>Conflict Resolution</Label>
                <Select
                  value={syncConfig.conflictStrategy}
                  onValueChange={(value: any) => setSyncConfig({ ...syncConfig, conflictStrategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmb_wins">GMB Wins (Use Google data)</SelectItem>
                    <SelectItem value="local_wins">Local Wins (Keep local data)</SelectItem>
                    <SelectItem value="merge">Merge (Combine both)</SelectItem>
                    <SelectItem value="newest_wins">Newest Wins (Most recent)</SelectItem>
                    <SelectItem value="manual">Manual Review</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How to handle conflicts when data differs
                </p>
              </div>

              <Separator />

              {/* Data Types */}
              <div className="space-y-2">
                <Label>Data Types to Sync</Label>
                <div className="space-y-2">
                  {Object.entries(syncConfig.dataTypes || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`sync-${key}`} className="font-normal capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Switch
                        id={`sync-${key}`}
                        checked={value}
                        onCheckedChange={(checked) => setSyncConfig({
                          ...syncConfig,
                          dataTypes: { ...syncConfig.dataTypes, [key]: checked }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Save Configuration */}
              <Button
                onClick={() => configureSyncMutation.mutate(syncConfig)}
                disabled={configureSyncMutation.isPending}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                View past synchronization sessions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {syncHistory.map((session: any) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          <Badge variant={session.status === 'success' ? 'default' : 'destructive'}>
                            {session.status}
                          </Badge>
                          <Badge variant="outline">{session.syncType}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Items Processed:</span>
                          <span className="ml-2 font-medium">{session.itemsProcessed || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Updated:</span>
                          <span className="ml-2 font-medium">{session.itemsUpdated || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2 font-medium">
                            {session.durationMs ? formatDuration(session.durationMs) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {session.errorMessage && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{session.errorMessage}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                  
                  {syncHistory.length === 0 && (
                    <div className="text-center py-12">
                      <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No sync history available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Report</CardTitle>
              <CardDescription>
                Detailed analysis of synchronization performance and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncReport && (
                <>
                  {/* Recommendations */}
                  {syncReport.recommendations && syncReport.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Recommendations</h3>
                      <div className="space-y-2">
                        {syncReport.recommendations.map((rec: string, index: number) => (
                          <Alert key={index}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Most Synced Data Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Most Synced Data</p>
                      <p className="font-medium capitalize">{syncReport.mostSyncedDataType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Successful Sync</p>
                      <p className="font-medium">
                        {syncHistory.find((s: any) => s.status === 'success')
                          ? new Date(syncHistory.find((s: any) => s.status === 'success').createdAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Export Options */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report (CSV)
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report (PDF)
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
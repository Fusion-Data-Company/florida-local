import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GMBStatusWidgetProps {
  businessId?: number;
  variant?: 'full' | 'compact';
}

interface GMBStatus {
  connected: boolean;
  lastSync?: Date;
  nextSync?: Date;
  reviewCount?: number;
  averageRating?: number;
  views?: number;
  searchAppearances?: number;
  error?: string;
}

export function GMBStatusWidget({ businessId, variant = 'full' }: GMBStatusWidgetProps) {
  const [status, setStatus] = useState<GMBStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadGMBStatus();
    } else {
      setIsLoading(false);
    }
  }, [businessId]);

  const loadGMBStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gmb/status/${businessId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({
          connected: data.connected || false,
          lastSync: data.lastSync ? new Date(data.lastSync) : undefined,
          nextSync: data.nextSync ? new Date(data.nextSync) : undefined,
          reviewCount: data.reviewCount,
          averageRating: data.averageRating,
          views: data.views,
          searchAppearances: data.searchAppearances,
        });
      } else {
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error loading GMB status:', error);
      setStatus({ connected: false, error: 'Failed to load status' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/gmb/sync/${businessId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await loadGMBStatus();
        // Show success notification
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing GMB:', error);
      setStatus(prev => ({ ...prev, error: 'Sync failed' }));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `/api/gmb/connect/${businessId}`;
  };

  if (isLoading) {
    return (
      <Card className={variant === 'compact' ? 'w-full' : ''}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Compact variant for business profile sidebar
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-l-4" style={{
          borderLeftColor: status.connected ? '#10b981' : '#ef4444'
        }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {status.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-semibold text-sm">
                  {status.connected ? 'GMB Connected' : 'GMB Not Connected'}
                </span>
              </div>
              {status.connected && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {status.connected ? (
              <div className="space-y-2">
                {status.lastSync && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last sync:</span>
                    <span className="font-medium">
                      {new Date(status.lastSync).toLocaleString()}
                    </span>
                  </div>
                )}

                {status.averageRating && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{status.averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({status.reviewCount})</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => window.location.href = `/gmb/${businessId}`}
                >
                  View GMB Dashboard
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleConnect}
              >
                Connect Google My Business
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Full variant for dashboard
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Google My Business Integration
                {status.connected ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {status.connected
                  ? 'Your business is synced with Google My Business'
                  : 'Connect to unlock powerful insights and automation'}
              </CardDescription>
            </div>
            {status.connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}

          {status.connected ? (
            <>
              {/* Sync Status */}
              <div className="grid gap-4 md:grid-cols-2">
                {status.lastSync && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Last Sync</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(status.lastSync).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {status.nextSync && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Next Sync</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(status.nextSync).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {status.reviewCount !== undefined && (
                  <div className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                    <Star className="h-8 w-8 text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">{status.reviewCount}</div>
                    <div className="text-xs text-muted-foreground text-center">Total Reviews</div>
                  </div>
                )}

                {status.averageRating !== undefined && (
                  <div className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{status.averageRating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground text-center">Avg Rating</div>
                  </div>
                )}

                {status.views !== undefined && (
                  <div className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <Users className="h-8 w-8 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">{status.views.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground text-center">Profile Views</div>
                  </div>
                )}

                {status.searchAppearances !== undefined && (
                  <div className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                    <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">{status.searchAppearances.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground text-center">Search Views</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => window.location.href = `/gmb/${businessId}`}
                >
                  View Full Dashboard
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/gmb/${businessId}/settings`}
                >
                  Settings
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Connect Call to Action */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Google My Business account to automatically sync your business
                  information, reviews, and insights. Get AI-powered recommendations to improve
                  your local search presence.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Benefits of connecting:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Automatic sync of business hours, photos, and posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Real-time review monitoring and AI-powered response suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Performance insights and local search optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Competitive analysis and market trends</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={handleConnect}
              >
                <img
                  src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                  alt="Google"
                  className="h-5 w-5 mr-2"
                />
                Connect Google My Business
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

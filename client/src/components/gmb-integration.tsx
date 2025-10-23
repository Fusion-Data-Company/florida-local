import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, MapPin, Phone, Globe, Calendar, Star, RefreshCw } from "lucide-react";

interface GMBIntegrationProps {
  business: Business;
  isOwner: boolean;
}

interface GMBStatus {
  isConnected: boolean;
  isVerified?: boolean;
  syncDetails?: {
    lastSyncAt: string;
    status: string;
  };
}

interface GMBConnectResponse {
  success: boolean;
  authUrl: string;
  message: string;
}

interface GMBSyncResponse {
  success: boolean;
  businessInfo?: boolean;
  photos?: boolean;
  reviews?: boolean;
  message?: string;
}

interface GMBReview {
  id: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  rating: number;
  comment?: string;
  reviewTime: string;
  replyComment?: string;
  replyTime?: string;
}

export function GMBVerificationBadge({ business }: { business: Business }) {
  const isGMBVerified = business.gmbVerified;
  const isGMBConnected = business.gmbConnected;

  if (isGMBVerified) {
    return (
      <Badge className="bg-blue-600 text-white hover:bg-blue-700" data-testid="badge-gmb-verified">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Google Verified
      </Badge>
    );
  }

  if (isGMBConnected) {
    return (
      <Badge variant="outline" className="border-blue-500 text-blue-600" data-testid="badge-gmb-connected">
        <ExternalLink className="h-3 w-3 mr-1" />
        Google Connected
      </Badge>
    );
  }

  return null;
}

export function GMBConnectionFlow({ business, isOwner }: GMBIntegrationProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch GMB status
  const { data: gmbStatus, isLoading: statusLoading } = useQuery<GMBStatus>({
    queryKey: ['/api/businesses', business.id, 'gmb', 'status'],
    enabled: isOwner,
  });

  // Connection mutation
  const connectMutation = useMutation({
    mutationFn: async (): Promise<GMBConnectResponse> => {
      const response = await apiRequest('POST', `/api/businesses/${business.id}/gmb/connect`);
      return response as GMBConnectResponse;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        setIsConnecting(true);
        
        // Poll for connection status
        const checkConnection = setInterval(async () => {
          try {
            await queryClient.invalidateQueries({ 
              queryKey: ['/api/businesses', business.id, 'gmb', 'status'] 
            });
            const status = await queryClient.fetchQuery({
              queryKey: ['/api/businesses', business.id, 'gmb', 'status'],
            }) as GMBStatus;
            if (status?.isConnected) {
              clearInterval(checkConnection);
              setIsConnecting(false);
              toast({
                title: "Connected!",
                description: "Successfully connected to Google My Business",
              });
            }
          } catch (error) {
            // Continue polling
          }
        }, 3000);
        
        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(checkConnection);
          setIsConnecting(false);
        }, 300000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Google My Business",
        variant: "destructive",
      });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (): Promise<GMBSyncResponse> => {
      return await apiRequest('POST', `/api/businesses/${business.id}/gmb/sync`) as GMBSyncResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Synced ${data.businessInfo ? 'business info, ' : ''}${data.photos ? 'photos, ' : ''}${data.reviews ? 'reviews' : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', business.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', business.id, 'gmb'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with Google My Business",
        variant: "destructive",
      });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/businesses/${business.id}/gmb/disconnect`);
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Google My Business",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', business.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', business.id, 'gmb'] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect from Google My Business",
        variant: "destructive",
      });
    },
  });

  if (!isOwner) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <ExternalLink className="h-5 w-5 mr-2 text-blue-600" />
          Google My Business Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ) : gmbStatus?.isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Connected to Google My Business</span>
                {gmbStatus.isVerified && (
                  <Badge className="bg-blue-600 text-white">Verified</Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                data-testid="button-gmb-disconnect"
              >
                Disconnect
              </Button>
            </div>

            {gmbStatus.syncDetails && (
              <div className="text-sm text-muted-foreground">
                Last synced: {new Date(gmbStatus.syncDetails.lastSyncAt).toLocaleString()}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                size="sm"
                data-testid="button-gmb-sync"
              >
                {syncMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-gmb-settings">
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Google My Business Settings</DialogTitle>
                    <DialogDescription>
                      Manage your Google My Business integration settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Sync Options</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure what data to sync from Google My Business
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Data Sources</h4>
                      <p className="text-sm text-muted-foreground">
                        View where your business data comes from
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span>Connect to Google My Business to sync your business data</span>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Benefits of connecting:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Verify your business with Google</li>
                <li>Sync business hours, contact info, and photos</li>
                <li>Import customer reviews and ratings</li>
                <li>Keep information up-to-date automatically</li>
              </ul>
            </div>

            <Button 
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || isConnecting}
              className="w-full"
              data-testid="button-gmb-connect"
            >
              {connectMutation.isPending || isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  {isConnecting ? 'Connecting...' : 'Preparing...'}
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google My Business
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GMBReviewsSection({ businessId, isOwner }: { businessId: string; isOwner: boolean }) {
  const { data: reviews = [], isLoading } = useQuery<GMBReview[]>({
    queryKey: ['/api/businesses', businessId, 'gmb', 'reviews'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No Google reviews yet.</p>
        {isOwner && (
          <p className="text-sm text-muted-foreground mt-2">
            Connect to Google My Business to sync reviews
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="miami-glass miami-hover-lift miami-card-glow rounded-2xl overflow-hidden" data-testid={`review-${review.id}`}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              {review.reviewerPhotoUrl ? (
                <img 
                  src={review.reviewerPhotoUrl} 
                  alt={review.reviewerName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {review.reviewerName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium miami-heading">{review.reviewerName || 'Anonymous'}</h4>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < review.rating 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(review.reviewTime).toLocaleDateString()}
                  </div>
                </div>
                
                {review.comment && (
                  <p className="text-foreground mb-3 miami-body-text leading-relaxed">{review.comment}</p>
                )}
                
                {review.replyComment && (
                  <div className="bg-muted rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium mb-1">Business Response:</p>
                    <p className="text-sm">{review.replyComment}</p>
                    {review.replyTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.replyTime).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                <Badge variant="outline" className="mt-2 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Google Review
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GMBDataAttribution({ business }: { business: Business }) {
  const gmbDataSources = business.gmbDataSources as any;
  
  if (!gmbDataSources || Object.keys(gmbDataSources).length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <ExternalLink className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Data Sources</span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        {Object.entries(gmbDataSources).map(([field, source]) => (
          <div key={field} className="flex items-center justify-between">
            <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <Badge variant="outline" className="text-xs">
              {source === 'gmb' ? 'Google My Business' : 'Local'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
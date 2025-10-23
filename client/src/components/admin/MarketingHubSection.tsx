import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Users,
  TrendingUp,
  Send,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";

interface MarketingData {
  campaigns: {
    items: any[];
    stats: {
      total: number;
      active: number;
      completed: number;
      draft: number;
    };
  };
  segments: {
    items: any[];
    stats: {
      total: number;
      avgSize: number;
    };
  };
}

export function MarketingHubSection() {
  const { data: marketing, isLoading } = useQuery<MarketingData>({
    queryKey: ["/api/admin/marketing"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading marketing data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!marketing) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">No marketing data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{marketing.campaigns.stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{marketing.campaigns.stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Segments</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{marketing.segments.stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Segment Size</CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(marketing.segments.stats.avgSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">Members per segment</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Campaigns
          </CardTitle>
          <CardDescription>Latest marketing campaigns across all businesses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {marketing.campaigns.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns found
            </div>
          ) : (
            marketing.campaigns.items.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <Badge variant={
                          campaign.status === "active" ? "default" :
                          campaign.status === "completed" ? "outline" :
                          "secondary"
                        }>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {campaign.scheduledAt && (
                          <span>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(campaign.scheduledAt).toLocaleDateString()}
                          </span>
                        )}
                        {campaign.sentCount !== undefined && (
                          <span>
                            <Send className="h-3 w-3 inline mr-1" />
                            {campaign.sentCount} sent
                          </span>
                        )}
                        {campaign.openRate !== undefined && (
                          <span>
                            <Mail className="h-3 w-3 inline mr-1" />
                            {(campaign.openRate * 100).toFixed(1)}% open rate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Segments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segments
          </CardTitle>
          <CardDescription>Audience segmentation for targeted campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {marketing.segments.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No segments found
            </div>
          ) : (
            marketing.segments.items.map((segment) => (
              <Card key={segment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{segment.name}</h4>
                      {segment.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {segment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                          {segment.memberCount || 0} members
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {segment.type || "Custom"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(segment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

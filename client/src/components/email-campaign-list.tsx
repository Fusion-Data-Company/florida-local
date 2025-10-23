/**
 * Email Campaign List Component
 *
 * Display and manage all email marketing campaigns with:
 * - Campaign cards with status and metrics
 * - Filtering by status and type
 * - Search functionality
 * - Quick actions (edit, duplicate, delete, send, pause)
 * - Performance metrics overview
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Send,
  Pause,
  Play,
  Mail,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
  type: 'email' | 'sms';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
}

interface EmailCampaignListProps {
  businessId: string;
  onCreateNew?: () => void;
  onEditCampaign?: (campaignId: string) => void;
}

export function EmailCampaignList({
  businessId,
  onCreateNew,
  onEditCampaign,
}: EmailCampaignListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/marketing/campaigns', { businessId, status: statusFilter !== 'all' ? statusFilter : undefined }],
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Duplicate campaign mutation
  const duplicateCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to duplicate campaign');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign duplicated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: false }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to send campaign');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      toast({
        title: 'Campaign Sent',
        description: `Successfully sent to ${data.sent} recipients`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter campaigns by search query
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate overview stats
  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    active: campaigns.filter(c => c.status === 'active').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    avgOpenRate: campaigns.filter(c => c.openRate).reduce((sum, c) => sum + parseFloat(c.openRate.toString()), 0) / campaigns.filter(c => c.openRate).length || 0,
    avgClickRate: campaigns.filter(c => c.clickRate).reduce((sum, c) => sum + parseFloat(c.clickRate.toString()), 0) / campaigns.filter(c => c.clickRate).length || 0,
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      scheduled: { variant: 'default', label: 'Scheduled' },
      active: { variant: 'default', label: 'Active' },
      paused: { variant: 'outline', label: 'Paused' },
      completed: { variant: 'default', label: 'Completed' },
      archived: { variant: 'outline', label: 'Archived' },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // Handle campaign actions
  const handleEdit = (campaignId: string) => {
    if (onEditCampaign) {
      onEditCampaign(campaignId);
    }
  };

  const handleDuplicate = (campaignId: string) => {
    duplicateCampaignMutation.mutate(campaignId);
  };

  const handleDelete = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleSend = (campaignId: string) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      sendCampaignMutation.mutate(campaignId);
    }
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteCampaignMutation.mutate(campaignToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="text-center">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground">
              Create and manage your email marketing campaigns
            </p>
          </div>
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgOpenRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Click Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgClickRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No campaigns match your filters'
                : 'Create your first email campaign to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <CardDescription className="text-base">
                      {campaign.subject}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(campaign.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {campaign.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handleSend(campaign.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Send Now
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(campaign.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Recipients</div>
                      <div className="font-semibold">
                        {campaign.sentCount > 0 ? campaign.sentCount : campaign.totalRecipients}
                      </div>
                    </div>
                  </div>

                  {campaign.deliveredCount > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Delivered</div>
                          <div className="font-semibold">
                            {campaign.deliveredCount} ({campaign.deliveryRate}%)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Opened</div>
                          <div className="font-semibold">
                            {campaign.openedCount} ({campaign.openRate}%)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Clicked</div>
                          <div className="font-semibold">
                            {campaign.clickedCount} ({campaign.clickRate}%)
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.sentAt ? 'Sent' : campaign.scheduledAt ? 'Scheduled' : 'Created'}
                      </div>
                      <div className="font-semibold text-sm">
                        {formatDistanceToNow(
                          new Date(campaign.sentAt || campaign.scheduledAt || campaign.createdAt),
                          { addSuffix: true }
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar for sent campaigns */}
                {campaign.sentCount > 0 && campaign.deliveredCount > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-medium">
                        {campaign.openedCount} opens, {campaign.clickedCount} clicks
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${(campaign.openedCount / campaign.deliveredCount) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(campaign.clickedCount / campaign.deliveredCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

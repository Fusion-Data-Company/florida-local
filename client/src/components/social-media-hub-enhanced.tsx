import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek } from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Plus,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Video,
  Hash,
  AtSign,
  Send,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  BarChart as BarChartIcon,
  Users,
  Sparkles,
  Zap,
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle,
  AlertCircle,
  Settings,
  Globe,
  Shield,
  ChevronRight,
  Upload,
  Loader2,
  X,
  Filter,
  Download,
  FileSpreadsheet,
  Bell,
  BellOff,
  Star,
  Target,
  Activity,
  DollarSign,
  Repeat,
  Bot,
  Rss,
  Gift,
  UserPlus,
  Mic,
  TrendingDown,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { SiTiktok, SiPinterest } from "react-icons/si";
import { cn } from "@/lib/utils";

// Comprehensive interfaces
interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountHandle: string;
  profileUrl: string;
  profileImageUrl: string;
  isActive: boolean;
  lastSyncedAt: string;
  followers?: number;
  following?: number;
  posts?: number;
  accessToken?: string;
  refreshToken?: string;
}

interface SocialPost {
  id: string;
  businessId: string;
  platform: string[];
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduledFor?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  campaignId?: string;
  categoryId?: string;
  metrics?: PostMetrics;
}

interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  saves?: number;
  clicks?: number;
}

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  budget?: number;
  spent?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  goals: string[];
  kpis: Record<string, number>;
  posts: number;
  reach: number;
  engagement: number;
}

interface Message {
  id: string;
  platform: string;
  senderName: string;
  senderImage?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sentiment?: 'positive' | 'neutral' | 'negative';
  status: 'unread' | 'read' | 'replied' | 'archived';
  assignedTo?: string;
}

interface Mention {
  id: string;
  platform: string;
  authorName: string;
  authorHandle: string;
  content: string;
  url: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reach: number;
}

interface Automation {
  id: string;
  name: string;
  type: 'rss' | 'product' | 'review' | 'event' | 'welcome' | 'birthday';
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun?: string;
  runsCount: number;
  platforms: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  permissions: string[];
  avatar?: string;
  lastActive?: string;
}

interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  usageCount: number;
  lastUsed?: string;
  tags: string[];
}

// Platform configurations
const PLATFORMS: Record<string, any> = {
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    maxChars: 63206,
    features: {
      images: true,
      videos: true,
      stories: true,
      reels: true,
      hashtags: true,
      mentions: true,
      carousel: true,
    },
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="w-5 h-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    maxChars: 2200,
    features: {
      images: true,
      videos: true,
      stories: true,
      reels: true,
      hashtags: true,
      mentions: true,
      carousel: true,
    },
  },
  twitter: {
    name: 'X (Twitter)',
    icon: <Twitter className="w-5 h-5" />,
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    maxChars: 280,
    features: {
      images: true,
      videos: true,
      hashtags: true,
      mentions: true,
      threads: true,
    },
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    maxChars: 3000,
    features: {
      images: true,
      videos: true,
      hashtags: true,
      mentions: true,
      articles: true,
    },
  },
  youtube: {
    name: 'YouTube',
    icon: <Youtube className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    maxChars: 5000,
    features: {
      videos: true,
      thumbnails: true,
      hashtags: true,
      playlists: true,
      shorts: true,
    },
  },
  tiktok: {
    name: 'TikTok',
    icon: <SiTiktok className="w-5 h-5" />,
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    maxChars: 2200,
    features: {
      videos: true,
      hashtags: true,
      mentions: true,
      sounds: true,
      effects: true,
    },
  },
  pinterest: {
    name: 'Pinterest',
    icon: <SiPinterest className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    maxChars: 500,
    features: {
      images: true,
      videos: true,
      hashtags: true,
      boards: true,
      pins: true,
    },
  },
};

interface SocialMediaHubEnhancedProps {
  businessId: string;
}

export function SocialMediaHubEnhanced({ businessId }: SocialMediaHubEnhancedProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);

  // Queries
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['/api/social-media/accounts', businessId],
    enabled: !!businessId,
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['/api/social-media/posts', businessId],
    enabled: !!businessId,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['/api/social-media/analytics', businessId, 'summary'],
    enabled: !!businessId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/social-media/campaigns', businessId],
    enabled: !!businessId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/social-media/messages', businessId],
    enabled: !!businessId,
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['/api/social-media/mentions', businessId],
    enabled: !!businessId,
  });

  const { data: automations = [] } = useQuery({
    queryKey: ['/api/social-media/automation', businessId],
    enabled: !!businessId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['/api/social-media/templates', businessId],
    enabled: !!businessId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/social-media/team', businessId],
    enabled: !!businessId,
  });

  // Mutations
  const connectAccount = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/social-media/accounts/connect', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/accounts'] });
      toast({
        title: "Account connected",
        description: "Social media account has been connected successfully.",
      });
    },
  });

  const createPost = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/social-media/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
      toast({
        title: "Post created",
        description: "Your post has been scheduled successfully.",
      });
      setShowComposer(false);
      resetComposer();
    },
  });

  const publishPost = useMutation({
    mutationFn: (postId: string) =>
      apiRequest(`/api/social-media/posts/${postId}/publish`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
      toast({
        title: "Post published",
        description: "Your post has been published successfully.",
      });
    },
  });

  const bulkSchedule = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/social-media/posts/bulk-schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
      toast({
        title: "Bulk schedule complete",
        description: "Posts have been scheduled successfully.",
      });
      setBulkUploadFile(null);
    },
  });

  const sendReply = useMutation({
    mutationFn: (data: { messageId: string; response: string }) =>
      apiRequest(`/api/social-media/messages/${data.messageId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ response: data.response }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/messages'] });
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      });
      setReplyContent("");
    },
  });

  const createAutomation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/social-media/automation', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/automation'] });
      toast({
        title: "Automation created",
        description: "Your automation has been set up successfully.",
      });
    },
  });

  const resetComposer = () => {
    setPostContent("");
    setSelectedPlatforms([]);
    setMediaFiles([]);
    setScheduledDate(undefined);
    setHashtags([]);
    setSelectedCampaign("");
  };

  // Platform OAuth handlers
  const handlePlatformConnect = async (platform: string) => {
    // In production, this would initiate OAuth flow
    window.location.href = `/api/social-media/auth/${platform}?businessId=${businessId}`;
  };

  // Calculate analytics summary
  const analyticsSummary = analyticsData?.summary || {
    totalImpressions: 0,
    totalEngagements: 0,
    totalReach: 0,
    avgEngagementRate: 0,
  };

  // Get unread messages count
  const unreadMessagesCount = messages.filter((m: Message) => !m.isRead).length;

  // Calendar view data preparation
  const calendarPosts = posts.reduce((acc: any, post: SocialPost) => {
    if (post.scheduledFor) {
      const date = format(new Date(post.scheduledFor), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(post);
    }
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Media Hub</h1>
          <p className="text-muted-foreground">
            Manage all your social media from one place
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries()}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowComposer(true)} data-testid="button-compose">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary.totalReach.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary.avgEngagementRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline text-green-600" /> +12.5%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((p: SocialPost) => p.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to publish</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessagesCount}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="composer">Composer</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="listening">Listening</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Your latest published content</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {posts
                      .filter((p: SocialPost) => p.status === 'published')
                      .slice(0, 5)
                      .map((post: SocialPost) => (
                        <div
                          key={post.id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-2">
                              {post.platform.map((p) => (
                                <div
                                  key={p}
                                  className={cn(
                                    "p-1 rounded",
                                    PLATFORMS[p]?.bgColor
                                  )}
                                >
                                  {PLATFORMS[p]?.icon}
                                </div>
                              ))}
                            </div>
                            <Badge variant="outline">Published</Badge>
                          </div>
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          {post.metrics && (
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.metrics.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.metrics.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {post.metrics.comments}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="w-3 h-3" />
                                {post.metrics.shares}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={[
                      { name: 'Mon', engagement: 4.2, reach: 2400 },
                      { name: 'Tue', engagement: 3.8, reach: 1398 },
                      { name: 'Wed', engagement: 5.1, reach: 9800 },
                      { name: 'Thu', engagement: 4.7, reach: 3908 },
                      { name: 'Fri', engagement: 4.9, reach: 4800 },
                      { name: 'Sat', engagement: 3.6, reach: 3800 },
                      { name: 'Sun', engagement: 4.3, reach: 4300 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="engagement"
                      stroke="#8884d8"
                      name="Engagement Rate (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="reach"
                      stroke="#82ca9d"
                      name="Reach"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(PLATFORMS).map(([key, platform]) => {
                  const account = accounts.find((a: SocialAccount) => a.platform === key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-4 rounded-lg border-2",
                        platform.borderColor,
                        account ? platform.bgColor : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded", platform.bgColor)}>
                            {platform.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{platform.name}</h4>
                            {account ? (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  @{account.accountHandle}
                                </p>
                                <div className="flex gap-3 mt-1 text-xs">
                                  <span>{account.followers?.toLocaleString()} followers</span>
                                  <span>{account.posts?.toLocaleString()} posts</span>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Not connected
                              </p>
                            )}
                          </div>
                        </div>
                        {account ? (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            Connected
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePlatformConnect(key)}
                            data-testid={`button-connect-${key}`}
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                      {account && (
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Last synced: {format(new Date(account.lastSyncedAt), 'PPp')}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePlatformConnect(key)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Sync
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Composer Tab */}
        <TabsContent value="composer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Post</CardTitle>
              <CardDescription>Compose and schedule your social media content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Selection */}
              <div>
                <Label>Select Platforms</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(PLATFORMS).map(([key, platform]) => (
                    <Button
                      key={key}
                      variant={selectedPlatforms.includes(key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedPlatforms(prev =>
                          prev.includes(key)
                            ? prev.filter(p => p !== key)
                            : [...prev, key]
                        );
                      }}
                      data-testid={`button-platform-${key}`}
                    >
                      {platform.icon}
                      <span className="ml-2">{platform.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="What would you like to share?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[150px]"
                  data-testid="textarea-content"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{postContent.length} characters</span>
                  {selectedPlatforms.length > 0 && (
                    <span>
                      Max: {Math.min(...selectedPlatforms.map(p => PLATFORMS[p]?.maxChars || 280))}
                    </span>
                  )}
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop or click to upload
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    id="media-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setMediaFiles(files);
                    }}
                    data-testid="input-media"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="media-upload" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>
                {mediaFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {mediaFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative p-2 border rounded flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMediaFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add hashtags..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        if (input.value) {
                          setHashtags(prev => [...prev, input.value]);
                          input.value = '';
                        }
                      }
                    }}
                    data-testid="input-hashtags"
                  />
                  <Button variant="outline" size="icon">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        #{tag}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-1 p-0 h-auto"
                          onClick={() => {
                            setHashtags(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-schedule"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP p") : "Publish now"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetComposer}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => {
                      createPost.mutate({
                        businessId,
                        platform: selectedPlatforms,
                        content: postContent,
                        hashtags,
                        scheduledFor: scheduledDate,
                        status: scheduledDate ? 'scheduled' : 'published',
                      });
                    }}
                    disabled={!postContent || selectedPlatforms.length === 0}
                    data-testid="button-publish"
                  >
                    {scheduledDate ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule Post
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publish Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Schedule</CardTitle>
              <CardDescription>Upload CSV/Excel file to schedule multiple posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload CSV or Excel file with your posts
                </p>
                <Input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  id="bulk-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBulkUploadFile(file);
                  }}
                  data-testid="input-bulk-upload"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="bulk-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
                {bulkUploadFile && (
                  <div className="mt-4 p-3 bg-gray-50 rounded flex items-center justify-between">
                    <span className="text-sm">{bulkUploadFile.name}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          bulkSchedule.mutate({
                            csvData: e.target?.result,
                            businessId,
                          });
                        };
                        reader.readAsText(bulkUploadFile);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Process
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Download <a href="#" className="underline">template file</a> for reference
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
              <CardDescription>Visual overview of your scheduled content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = addDays(startOfWeek(new Date()), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayPosts = calendarPosts[dateStr] || [];
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[100px] border rounded p-2",
                        dayPosts.length > 0 && "bg-blue-50"
                      )}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(date, 'd')}
                      </div>
                      {dayPosts.slice(0, 2).map((post: SocialPost) => (
                        <div
                          key={post.id}
                          className="text-xs p-1 bg-white rounded mb-1 truncate"
                        >
                          <div className="flex gap-1">
                            {post.platform.map(p => (
                              <span key={p} className={PLATFORMS[p]?.color}>
                                {PLATFORMS[p]?.icon}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayPosts.length - 2} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Facebook', value: 35, color: '#1877F2' },
                        { name: 'Instagram', value: 25, color: '#E4405F' },
                        { name: 'Twitter', value: 20, color: '#1DA1F2' },
                        { name: 'LinkedIn', value: 15, color: '#0A66C2' },
                        { name: 'Others', value: 5, color: '#9CA3AF' },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {[0, 1, 2, 3, 4].map((index) => (
                        <Cell key={index} fill={['#1877F2', '#E4405F', '#1DA1F2', '#0A66C2', '#9CA3AF'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Likes</span>
                    </div>
                    <span className="font-medium">12.4K</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Comments</span>
                    </div>
                    <span className="font-medium">3.2K</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Shares</span>
                    </div>
                    <span className="font-medium">1.8K</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Views</span>
                    </div>
                    <span className="font-medium">45.6K</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {posts
                      .filter((p: SocialPost) => p.metrics)
                      .sort((a: SocialPost, b: SocialPost) => 
                        (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0)
                      )
                      .slice(0, 5)
                      .map((post: SocialPost, index: number) => (
                        <div key={post.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {post.metrics?.engagementRate.toFixed(1)}% engagement
                              </Badge>
                              <span>{post.metrics?.views} views</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Over Time</CardTitle>
              <CardDescription>Track your audience growth across platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={[
                    { month: 'Jan', followers: 4500, engagement: 4.2 },
                    { month: 'Feb', followers: 5200, engagement: 4.5 },
                    { month: 'Mar', followers: 5800, engagement: 4.1 },
                    { month: 'Apr', followers: 6500, engagement: 4.8 },
                    { month: 'May', followers: 7300, engagement: 5.2 },
                    { month: 'Jun', followers: 8100, engagement: 5.5 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="followers"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Followers"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="engagement"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="Engagement Rate (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unified Inbox</CardTitle>
              <CardDescription>Manage all your social media messages in one place</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Message List */}
                <div className="lg:col-span-1 border-r">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2 pr-4">
                      {messages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-3 rounded cursor-pointer hover:bg-gray-50",
                            selectedMessage?.id === message.id && "bg-blue-50",
                            !message.isRead && "bg-blue-50/50"
                          )}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={message.senderImage} />
                              <AvatarFallback>
                                {message.senderName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {message.senderName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {PLATFORMS[message.platform]?.name}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.timestamp), 'p')}
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2 mt-1">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {!message.isRead && (
                                  <Badge variant="secondary" className="text-xs">
                                    New
                                  </Badge>
                                )}
                                {message.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">
                                    High Priority
                                  </Badge>
                                )}
                                {message.sentiment && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      message.sentiment === 'positive' && "text-green-600",
                                      message.sentiment === 'negative' && "text-red-600"
                                    )}
                                  >
                                    {message.sentiment}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Message View & Reply */}
                <div className="lg:col-span-2">
                  {selectedMessage ? (
                    <div className="flex flex-col h-[600px]">
                      {/* Message Header */}
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={selectedMessage.senderImage} />
                              <AvatarFallback>
                                {selectedMessage.senderName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {selectedMessage.senderName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                via {PLATFORMS[selectedMessage.platform]?.name}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Star className="w-4 h-4 mr-2" />
                                Mark as Important
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Flag for Review
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <X className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm">{selectedMessage.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(selectedMessage.timestamp), 'PPp')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reply Box */}
                      <div className="p-4 border-t">
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Use Template
                              </Button>
                              <Button variant="outline" size="sm">
                                <Bot className="w-4 h-4 mr-2" />
                                AI Suggest
                              </Button>
                            </div>
                            <Button
                              onClick={() => {
                                sendReply.mutate({
                                  messageId: selectedMessage.id,
                                  response: replyContent,
                                });
                              }}
                              disabled={!replyContent}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                      Select a message to view
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listening Tab */}
        <TabsContent value="listening" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brand Mentions */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Mentions</CardTitle>
                <CardDescription>Track mentions of your brand across social media</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {mentions.map((mention: Mention) => (
                      <div key={mention.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1 rounded", PLATFORMS[mention.platform]?.bgColor)}>
                              {PLATFORMS[mention.platform]?.icon}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {mention.authorName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{mention.authorHandle}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              mention.sentiment === 'positive' && "text-green-600 border-green-200",
                              mention.sentiment === 'negative' && "text-red-600 border-red-200"
                            )}
                          >
                            {mention.sentiment}
                          </Badge>
                        </div>
                        <p className="text-sm mt-2">{mention.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(mention.timestamp), 'PPp')}
                          </span>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
                <CardDescription>Popular hashtags and topics in your industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['#LocalBusiness', '#SmallBusinessLove', '#ShopLocal', '#CommunityFirst', '#FloridaBusiness'].map((tag, index) => (
                    <div key={tag} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{tag}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(Math.random() * 10000)} posts
                          </p>
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>Set up automated posting and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Create New Automation */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Automation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Automation Rule</DialogTitle>
                      <DialogDescription>
                        Set up automated actions for your social media
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Automation Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rss">RSS Feed Auto-post</SelectItem>
                            <SelectItem value="product">Product Sync</SelectItem>
                            <SelectItem value="review">Review to Social</SelectItem>
                            <SelectItem value="event">Event Promotion</SelectItem>
                            <SelectItem value="welcome">Welcome Message</SelectItem>
                            <SelectItem value="birthday">Birthday Posts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Trigger</Label>
                        <Input placeholder="e.g., New RSS item, 5-star review" />
                      </div>
                      <div>
                        <Label>Action</Label>
                        <Textarea placeholder="Describe what should happen..." />
                      </div>
                      <div>
                        <Label>Platforms</Label>
                        <div className="flex gap-2">
                          {Object.entries(PLATFORMS).map(([key, platform]) => (
                            <Button
                              key={key}
                              variant="outline"
                              size="sm"
                            >
                              {platform.icon}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Create Rule</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Existing Automations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {automations.map((automation: Automation) => (
                    <div
                      key={automation.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{automation.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {automation.trigger} → {automation.action}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {automation.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {automation.runsCount} runs
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={(checked) => {
                            // Toggle automation
                          }}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        {automation.platforms.map((platform) => (
                          <div
                            key={platform}
                            className={cn("p-1 rounded", PLATFORMS[platform]?.bgColor)}
                          >
                            {PLATFORMS[platform]?.icon}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Composer */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Quick Post</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComposer(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] mb-3"
            />
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Hash className="w-4 h-4" />
                </Button>
              </div>
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SocialMediaHubEnhanced;
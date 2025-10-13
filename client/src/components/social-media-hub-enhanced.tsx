import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
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
  BarChart,
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
  X
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountHandle: string;
  profileUrl: string;
  profileImageUrl: string;
  isActive: boolean;
  lastSyncedAt: string;
  metadata?: any;
}

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduledFor?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

interface PlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  maxChars: number;
  features: {
    images: boolean;
    videos: boolean;
    stories: boolean;
    reels: boolean;
    hashtags: boolean;
    mentions: boolean;
  };
}

const PLATFORMS: Record<string, PlatformConfig> = {
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    maxChars: 63206,
    features: {
      images: true,
      videos: true,
      stories: true,
      reels: true,
      hashtags: true,
      mentions: true
    }
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="w-5 h-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    maxChars: 2200,
    features: {
      images: true,
      videos: true,
      stories: true,
      reels: true,
      hashtags: true,
      mentions: true
    }
  },
  twitter: {
    name: 'X (Twitter)',
    icon: <Twitter className="w-5 h-5" />,
    color: 'text-gray-900',
    bgColor: 'bg-gray-100',
    maxChars: 280,
    features: {
      images: true,
      videos: true,
      stories: false,
      reels: false,
      hashtags: true,
      mentions: true
    }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    maxChars: 3000,
    features: {
      images: true,
      videos: true,
      stories: false,
      reels: false,
      hashtags: true,
      mentions: true
    }
  },
  tiktok: {
    name: 'TikTok',
    icon: <Video className="w-5 h-5" />,
    color: 'text-gray-900',
    bgColor: 'bg-gray-100',
    maxChars: 2200,
    features: {
      images: false,
      videos: true,
      stories: false,
      reels: true,
      hashtags: true,
      mentions: true
    }
  },
  pinterest: {
    name: 'Pinterest',
    icon: <ImageIcon className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    maxChars: 500,
    features: {
      images: true,
      videos: true,
      stories: false,
      reels: false,
      hashtags: true,
      mentions: false
    }
  },
  youtube: {
    name: 'YouTube',
    icon: <Youtube className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    maxChars: 5000,
    features: {
      images: false,
      videos: true,
      stories: false,
      reels: false,
      hashtags: true,
      mentions: false
    }
  }
};

export default function SocialMediaHubEnhanced() {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isScheduled, setIsScheduled] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  // Fetch connected social accounts
  const { data: socialAccounts, isLoading: accountsLoading } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social/accounts'],
  });

  // Fetch recent posts
  const { data: recentPosts } = useQuery<SocialPost[]>({
    queryKey: ['/api/social/posts'],
  });

  // Connect social account
  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest('GET', `/api/social/auth/${platform}?businessId=${businessId}`);
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect social account",
        variant: "destructive",
      });
    }
  });

  // Disconnect social account
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return await apiRequest('DELETE', `/api/social/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/accounts'] });
      toast({
        title: "Account Disconnected",
        description: "Social account has been disconnected",
      });
    }
  });

  // Publish post
  const publishMutation = useMutation({
    mutationFn: async (postData: any) => {
      return await apiRequest('POST', '/api/social/posts', postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts'] });
      toast({
        title: "Post Published",
        description: isScheduled ? "Your post has been scheduled" : "Your post has been published",
      });
      // Reset form
      setPostContent("");
      setMediaFiles([]);
      setSelectedPlatforms([]);
      setScheduledDate(undefined);
      setIsScheduled(false);
    },
    onError: (error: any) => {
      toast({
        title: "Publishing Failed",
        description: error.message || "Failed to publish post",
        variant: "destructive",
      });
    }
  });

  // Check URL params for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');

    if (connected) {
      toast({
        title: "Account Connected",
        description: `Successfully connected ${connected} account`,
      });
      // Remove params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast({
        title: "Connection Error",
        description: `Failed to connect account: ${error}`,
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('content', postContent);
    formData.append('platforms', JSON.stringify(selectedPlatforms));

    if (isScheduled && scheduledDate) {
      formData.append('scheduledFor', scheduledDate.toISOString());
    }

    mediaFiles.forEach(file => {
      formData.append('media', file);
    });

    publishMutation.mutate(formData);
  };

  const getCharCount = () => {
    if (selectedPlatforms.length === 0) return { current: 0, max: 280 };

    const minMax = Math.min(...selectedPlatforms.map(p => PLATFORMS[p]?.maxChars || 280));
    return { current: postContent.length, max: minMax };
  };

  const charCount = getCharCount();
  const charPercentage = (charCount.current / charCount.max) * 100;

  // Get business ID from URL or context
  const businessId = new URLSearchParams(window.location.search).get('businessId') || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Media Hub</h2>
          <p className="text-muted-foreground">Manage all your social accounts in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {socialAccounts?.filter(a => a.isActive).length || 0} Connected
          </Badge>
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Connect your social media accounts to start posting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(PLATFORMS).map(([platform, config]) => {
              const account = socialAccounts?.find(a => a.platform === platform && a.isActive);
              const isConnected = !!account;

              return (
                <div key={platform} className="text-center">
                  <div className="relative">
                    <Button
                      variant={isConnected ? "default" : "outline"}
                      className={`w-full h-20 flex flex-col gap-2 ${
                        isConnected ? config.bgColor : ''
                      }`}
                      onClick={() => {
                        if (isConnected && account) {
                          disconnectMutation.mutate(account.id);
                        } else {
                          connectMutation.mutate(platform);
                        }
                      }}
                    >
                      <div className={config.color}>
                        {config.icon}
                      </div>
                      <span className="text-xs">{config.name}</span>
                      {isConnected && (
                        <CheckCircle className="absolute top-1 right-1 w-3 h-3 text-green-600" />
                      )}
                    </Button>
                  </div>
                  {isConnected && account && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      @{account.accountHandle || account.accountName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose">
            <Send className="w-4 h-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="w-4 h-4 mr-2" />
            Scheduled
            {recentPosts?.filter(p => p.status === 'scheduled').length ? (
              <Badge variant="secondary" className="ml-2">
                {recentPosts.filter(p => p.status === 'scheduled').length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="published">
            <CheckCircle className="w-4 h-4 mr-2" />
            Published
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Post</CardTitle>
              <CardDescription>
                Compose and publish to multiple social platforms at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Selection */}
              <div>
                <Label>Select Platforms</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {socialAccounts?.filter(a => a.isActive).map(account => {
                    const config = PLATFORMS[account.platform];
                    if (!config) return null;

                    const isSelected = selectedPlatforms.includes(account.platform);

                    return (
                      <Button
                        key={account.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPlatforms(prev => prev.filter(p => p !== account.platform));
                          } else {
                            setSelectedPlatforms(prev => [...prev, account.platform]);
                          }
                        }}
                      >
                        <div className={`${config.color} mr-2`}>
                          {config.icon}
                        </div>
                        {config.name}
                      </Button>
                    );
                  })}
                </div>
                {selectedPlatforms.length === 0 && socialAccounts?.some(a => a.isActive) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select platforms to publish to
                  </p>
                )}
              </div>

              {/* Post Content */}
              <div>
                <Label htmlFor="content">Post Content</Label>
                <Textarea
                  id="content"
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[120px] mt-2"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={charPercentage}
                      className={`w-24 h-2 ${
                        charPercentage > 100 ? 'bg-red-200' : ''
                      }`}
                    />
                    <span className={`text-sm ${
                      charPercentage > 100 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {charCount.current} / {charCount.max}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const hashtags = postContent.match(/#\w+/g) || [];
                        toast({
                          title: "Hashtags",
                          description: hashtags.length ? hashtags.join(', ') : 'No hashtags found',
                        });
                      }}
                    >
                      <Hash className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const mentions = postContent.match(/@\w+/g) || [];
                        toast({
                          title: "Mentions",
                          description: mentions.length ? mentions.join(', ') : 'No mentions found',
                        });
                      }}
                    >
                      <AtSign className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <Label>Media</Label>
                <div className="mt-2">
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="relative">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeMedia(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <label>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Add Image
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleMediaUpload}
                        />
                      </label>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <label>
                        <Video className="w-4 h-4 mr-2" />
                        Add Video
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleMediaUpload}
                        />
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={setIsScheduled}
                  />
                  <Label htmlFor="schedule">Schedule Post</Label>
                </div>
                {isScheduled && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline">
                  Save as Draft
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Preview functionality
                      toast({
                        title: "Preview",
                        description: "Preview feature coming soon",
                      });
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={!postContent || selectedPlatforms.length === 0 || publishMutation.isPending}
                  >
                    {publishMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {isScheduled ? 'Schedule' : 'Publish Now'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Content Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    toast({
                      title: "AI Suggestions",
                      description: "AI hashtag suggestions coming soon",
                    });
                  }}
                >
                  <Hash className="w-4 h-4 mr-2 text-blue-600" />
                  Suggest Hashtags
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    toast({
                      title: "AI Enhancement",
                      description: "AI content enhancement coming soon",
                    });
                  }}
                >
                  <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                  Enhance Content
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    toast({
                      title: "AI Captions",
                      description: "AI caption generation coming soon",
                    });
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                  Generate Caption
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    toast({
                      title: "Best Time",
                      description: "Optimal posting time analysis coming soon",
                    });
                  }}
                >
                  <Clock className="w-4 h-4 mr-2 text-purple-600" />
                  Best Time to Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Posts</CardTitle>
              <CardDescription>Manage your upcoming scheduled posts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPosts?.filter(p => p.status === 'scheduled').length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No scheduled posts</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {recentPosts
                      ?.filter(p => p.status === 'scheduled')
                      .map((post) => (
                        <Card key={post.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {PLATFORMS[post.platform]?.icon}
                                  <Badge variant="outline">
                                    {PLATFORMS[post.platform]?.name}
                                  </Badge>
                                  <Badge variant="secondary">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {post.scheduledFor && format(new Date(post.scheduledFor), 'PPp')}
                                  </Badge>
                                </div>
                                <p className="text-sm line-clamp-2">{post.content}</p>
                              </div>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Published Tab */}
        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>View your recently published posts and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPosts?.filter(p => p.status === 'published').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No published posts yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {recentPosts
                      ?.filter(p => p.status === 'published')
                      .map((post) => (
                        <Card key={post.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {PLATFORMS[post.platform]?.icon}
                                  <Badge variant="outline">
                                    {PLATFORMS[post.platform]?.name}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {post.publishedAt && format(new Date(post.publishedAt), 'PPp')}
                                  </span>
                                </div>
                                <p className="text-sm mb-3">{post.content}</p>
                                {post.metrics && (
                                  <div className="flex gap-4 text-sm">
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
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {post.metrics.views}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,231</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7%</div>
                <p className="text-xs text-muted-foreground">
                  +1.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">
                  +15 this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,492</div>
                <p className="text-xs text-muted-foreground">
                  +573 new this month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(PLATFORMS).map(([platform, config]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${config.bgColor} p-2 rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-sm text-muted-foreground">2,341 followers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">5.2% engagement</p>
                      <p className="text-sm text-green-600">+0.8%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
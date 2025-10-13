import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Image as ImageIcon, Calendar, Globe, Sparkles, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface GMBPost {
  id: string;
  content: string;
  imageUrl?: string;
  status: "scheduled" | "posted" | "failed";
  scheduledFor?: string;
  postedAt?: string;
  gmbPostId?: string;
  error?: string;
}

interface GMBAutoPostProps {
  businessId: string;
  className?: string;
}

/**
 * GMB Auto-Post Component
 *
 * Allows businesses to create and schedule posts that automatically
 * publish to their Google My Business listing.
 *
 * @param businessId - The business to post for
 * @param className - Additional Tailwind classes
 */
export default function GMBAutoPost({
  businessId,
  className = ""
}: GMBAutoPostProps) {
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [autoPostEnabled, setAutoPostEnabled] = useState(true);
  const [postNow, setPostNow] = useState(true);

  // Fetch scheduled/recent posts
  const { data: posts = [], isLoading } = useQuery<GMBPost[]>({
    queryKey: ['/api/gmb/posts', businessId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // return fetch(`/api/gmb/posts/${businessId}`).then(res => res.json());

      // Mock data
      return [
        {
          id: "1",
          content: "🌞 Summer Special! Get 20% off all services this week. Book your appointment today! #SummerSale #LocalBusiness",
          imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
          status: "posted",
          postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          gmbPostId: "gmb-post-123",
        },
        {
          id: "2",
          content: "We're excited to announce our new product line! Stop by and check out our latest offerings. 🎉",
          status: "scheduled",
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          content: "Thank you to all our amazing customers! Your support means the world to us. ❤️",
          status: "posted",
          postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          gmbPostId: "gmb-post-456",
        },
      ] as GMBPost[];
    },
    enabled: Boolean(businessId),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; imageUrl?: string; postNow: boolean }) => {
      // TODO: Call actual API endpoint
      // await fetch(`/api/gmb/posts`, {
      //   method: 'POST',
      //   body: JSON.stringify({ businessId, ...data })
      // });
      await new Promise(resolve => setTimeout(resolve, 1500));
    },
    onSuccess: () => {
      toast({
        title: postNow ? "Post Published" : "Post Scheduled",
        description: postNow
          ? "Your post has been published to Google My Business."
          : "Your post will be published automatically.",
      });
      setPostContent("");
      setImageUrl("");
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/posts', businessId] });
    },
    onError: () => {
      toast({
        title: "Post Failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate AI content mutation
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      // TODO: Call actual AI endpoint
      // const response = await fetch(`/api/ai/generate-gmb-post`, {
      //   method: 'POST',
      //   body: JSON.stringify({ businessId, type: 'promotional' })
      // });
      // return response.json();
      await new Promise(resolve => setTimeout(resolve, 1500));

      const suggestions = [
        "🌟 We're thrilled to serve our amazing community! Stop by today and experience the difference that makes us special. Your support means everything to us!",
        "✨ New week, new opportunities! We're here to help you achieve your goals. Visit us today and let's make something great together!",
        "🎉 Exciting things are happening! We've been working hard to bring you the best experience possible. Come see what's new!",
      ];

      return { content: suggestions[Math.floor(Math.random() * suggestions.length)] };
    },
    onSuccess: (data) => {
      setPostContent(data.content);
      toast({
        title: "Content Generated",
        description: "AI has created post content. Feel free to edit before posting.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter post content.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: postContent,
      imageUrl: imageUrl || undefined,
      postNow,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Published</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Scheduled</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Failed</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Auto-Post to GMB
            </CardTitle>
            <CardDescription>
              Create posts that automatically publish to Google My Business
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={autoPostEnabled}
              onCheckedChange={setAutoPostEnabled}
              id="auto-post-toggle"
            />
            <Label htmlFor="auto-post-toggle" className="text-sm cursor-pointer">
              Auto-Post Enabled
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Post Form */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Create New Post</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateContentMutation.mutate()}
              disabled={generateContentMutation.isPending}
            >
              {generateContentMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Content
                </>
              )}
            </Button>
          </div>

          <div>
            <Label htmlFor="post-content" className="text-sm mb-2 block">
              Post Content
            </Label>
            <Textarea
              id="post-content"
              placeholder="What would you like to share with your customers?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {postContent.length} / 1500 characters
            </p>
          </div>

          <div>
            <Label htmlFor="post-image" className="text-sm mb-2 block">
              Image URL (Optional)
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="post-image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={imageUrl}
                alt="Post preview"
                className="w-full h-48 object-cover"
                onError={() => {
                  toast({
                    title: "Invalid Image",
                    description: "Could not load image from URL",
                    variant: "destructive",
                  });
                  setImageUrl("");
                }}
              />
            </div>
          )}

          {/* Post Options */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch
                checked={postNow}
                onCheckedChange={setPostNow}
                id="post-now-toggle"
              />
              <Label htmlFor="post-now-toggle" className="text-sm cursor-pointer">
                {postNow ? "Post immediately" : "Schedule for later"}
              </Label>
            </div>
            <Button
              onClick={handleCreatePost}
              disabled={createPostMutation.isPending || !postContent.trim()}
            >
              {createPostMutation.isPending ? (
                "Posting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {postNow ? "Post Now" : "Schedule Post"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Recent Posts */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Recent & Scheduled Posts</h4>
          {posts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className={`
                    border border-gray-200 rounded-lg p-4
                    hover:border-blue-300 hover:shadow-md
                    transition-all duration-300
                    entrance-slide-right stagger-${Math.min(index + 1, 8)}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(post.status)}
                      <span className="text-xs text-muted-foreground">
                        {post.status === "posted" && post.postedAt && (
                          <>Posted {formatDistanceToNow(new Date(post.postedAt), { addSuffix: true })}</>
                        )}
                        {post.status === "scheduled" && post.scheduledFor && (
                          <>Scheduled for {formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: true })}</>
                        )}
                        {post.status === "failed" && <>Failed to post</>}
                      </span>
                    </div>
                    {getStatusBadge(post.status)}
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div className="rounded-lg overflow-hidden mb-3">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  {post.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-700">{post.error}</p>
                    </div>
                  )}

                  {post.status === "posted" && post.gmbPostId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => window.open(`https://business.google.com/posts/${post.gmbPostId}`, '_blank')}
                    >
                      View on GMB
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

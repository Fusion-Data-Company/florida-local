import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Facebook,
  Twitter,
  Linkedin,
  ChevronLeft,
  User,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Reply,
  Edit,
  Trash2,
  Send,
  Copy,
  Check
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SelectBlogPost, SelectBlogComment, SelectBlogCategory, SelectBlogTag, SelectUser } from "@shared/schema";

interface BlogPostWithDetails extends SelectBlogPost {
  category?: SelectBlogCategory;
  tags?: SelectBlogTag[];
  author?: SelectUser;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");

  // Get current user
  const { data: currentUser } = useQuery<SelectUser>({
    queryKey: ['/api/auth/me']
  });

  // Fetch blog post
  const { data: post, isLoading: postLoading } = useQuery<BlogPostWithDetails>({
    queryKey: ['/api/blog/posts/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
    enabled: !!slug
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery<{
    comments: SelectBlogComment[];
    total: number;
  }>({
    queryKey: ['/api/blog/posts', post?.id, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${post?.id}/comments?sortBy=newest`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!post?.id
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery<SelectBlogPost[]>({
    queryKey: ['/api/blog/posts', post?.id, 'related'],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${post?.id}/related?limit=4`);
      if (!response.ok) throw new Error('Failed to fetch related posts');
      return response.json();
    },
    enabled: !!post?.id
  });

  // Track view
  useEffect(() => {
    if (post?.id) {
      // Track page view
      fetch(`/api/blog/posts/${post.id}/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionStorage.getItem('blog_session') || generateSessionId(),
          referrer: document.referrer,
          deviceType: getDeviceType(),
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        })
      });

      // Track engagement
      const trackEngagement = () => {
        const scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        fetch(`/api/blog/posts/${post.id}/track-engagement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'scroll',
            scrollDepth: Math.round(scrollDepth * 100),
            timeSpent: Math.floor((Date.now() - pageLoadTime) / 1000)
          })
        });
      };

      const pageLoadTime = Date.now();
      window.addEventListener('scroll', debounce(trackEngagement, 1000));
      
      return () => {
        window.removeEventListener('scroll', trackEngagement);
      };
    }
  }, [post?.id]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      return apiRequest('/api/blog/posts/' + post?.id + '/comments', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', post?.id, 'comments'] });
      setCommentText("");
      setReplyingTo(null);
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to post comment",
        description: "Please try again later.",
      });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return apiRequest('/api/blog/comments/' + id, {
        method: 'PUT',
        body: { content }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', post?.id, 'comments'] });
      setEditingComment(null);
      setEditText("");
      toast({
        title: "Comment updated!",
        description: "Your comment has been updated successfully.",
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest('/api/blog/comments/' + commentId, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', post?.id, 'comments'] });
      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
      });
    }
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      return apiRequest('/api/blog/posts/' + post?.id + '/reactions', {
        method: 'POST',
        body: { reactionType }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts/slug', slug] });
      toast({
        title: "Thanks for your feedback!",
      });
    }
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/blog/posts/' + post?.id + '/bookmarks', {
        method: 'POST',
        body: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Post bookmarked!",
        description: "You can find this post in your reading list.",
      });
    }
  });

  // Helper functions
  const generateSessionId = () => {
    const id = 'session_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('blog_session', id);
    return id;
  };

  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const shareUrl = window.location.href;
  const shareTitle = post?.title || '';

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
      
      // Track share
      fetch(`/api/blog/posts/${post?.id}/track-engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'share', platform })
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderComment = (comment: SelectBlogComment, depth = 0) => {
    const isEditing = editingComment === comment.id;
    const isAuthor = currentUser?.id === comment.authorId;
    const replies = commentsData?.comments.filter(c => c.parentId === comment.id) || [];

    return (
      <div key={comment.id} className={depth > 0 ? "ml-8 mt-4" : "mt-4"} data-testid={`comment-${comment.id}`}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.authorName} />
                  <AvatarFallback>{comment.authorName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{comment.authorName || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-comment-menu-${comment.id}`}>
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setEditingComment(comment.id);
                      setEditText(comment.content);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px]"
                  data-testid={`textarea-edit-${comment.id}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateCommentMutation.mutate({ id: comment.id, content: editText })}
                    data-testid={`button-save-edit-${comment.id}`}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}
          </CardContent>
          {!isEditing && (
            <CardFooter className="pt-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  data-testid={`button-reply-${comment.id}`}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="mr-1 h-3 w-3" />
                  {comment.likeCount || 0}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <Card className="ml-8 mt-3">
            <CardContent className="pt-4">
              <Textarea
                placeholder="Write your reply..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] mb-3"
                data-testid={`textarea-reply-${comment.id}`}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    addCommentMutation.mutate({ content: commentText, parentId: comment.id });
                  }}
                  disabled={!commentText.trim()}
                  data-testid={`button-submit-reply-${comment.id}`}
                >
                  <Send className="mr-1 h-3 w-3" />
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setCommentText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Render replies */}
        {replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (postLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-12 mb-4" />
        <Skeleton className="h-6 mb-8 w-1/2" />
        <Skeleton className="h-96 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
        <Link href="/blog">
          <Button data-testid="button-back-to-blog">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center text-sm text-muted-foreground">
          <Link href="/">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{post.title}</span>
        </nav>
      </div>

      {/* Main Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Post Header */}
          <header className="mb-8">
            {post.categoryId && (
              <Badge variant="secondary" className="mb-4" data-testid="text-post-category">
                {post.category?.name}
              </Badge>
            )}
            <h1 className="text-4xl font-bold mb-4" data-testid="text-post-title">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">
                {post.excerpt}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b">
              <div className="flex items-center gap-4">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={post.author.profilePictureURL || ''} />
                      <AvatarFallback>{post.author.displayName?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.author.displayName}</p>
                      <p className="text-sm text-muted-foreground">Author</p>
                    </div>
                  </div>
                )}
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {calculateReadTime(post.content || '')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.viewCount} views
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addReactionMutation.mutate('like')}
                  data-testid="button-like-post"
                >
                  <Heart className="mr-1 h-4 w-4" />
                  {post.likeCount}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  data-testid="button-bookmark-post"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-share-post">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                      <Facebook className="mr-2 h-4 w-4" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                      <Twitter className="mr-2 h-4 w-4" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyLink}>
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/blog?tags=${tag.id}`}>
                  <Badge variant="outline" className="cursor-pointer" data-testid={`badge-post-tag-${tag.id}`}>
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <Separator className="my-8" />

          {/* Comments Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="comments" data-testid="tab-comments">
                <MessageCircle className="mr-2 h-4 w-4" />
                Comments ({commentsData?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="related" data-testid="tab-related">
                Related Posts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              {/* Comment Form */}
              {currentUser ? (
                <Card className="mb-6">
                  <CardHeader>
                    <h3 className="font-semibold">Leave a Comment</h3>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[120px] mb-4"
                      data-testid="textarea-new-comment"
                    />
                    <Button
                      onClick={() => addCommentMutation.mutate({ content: commentText })}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      data-testid="button-post-comment"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Post Comment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-6">
                  <CardContent className="py-8 text-center">
                    <p className="mb-4">Please sign in to leave a comment.</p>
                    <Link href="/login">
                      <Button data-testid="button-signin-to-comment">Sign In</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-4 mb-2 w-1/4" />
                        <Skeleton className="h-3 mb-4 w-1/6" />
                        <Skeleton className="h-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {commentsData?.comments
                    ?.filter(c => !c.parentId)
                    .map(comment => renderComment(comment))}
                  
                  {(!commentsData || commentsData.comments.length === 0) && (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No comments yet. Be the first to share your thoughts!
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="related">
              {/* Related Posts */}
              <div className="grid md:grid-cols-2 gap-4">
                {relatedPosts?.map((relatedPost) => (
                  <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          <a className="hover:text-primary transition-colors" data-testid={`link-related-${relatedPost.id}`}>
                            {relatedPost.title}
                          </a>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(relatedPost.publishedAt || relatedPost.createdAt)}</span>
                        <span>{calculateReadTime(relatedPost.content || '')}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </article>
    </div>
  );
}
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ThumbsUp,
  Award,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Reply,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  userId: string;
  reactionType: 'like' | 'love' | 'clap' | 'insightful';
  count: number;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  content: string;
  parentCommentId?: string;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface BlogEngagementProps {
  postId: string;
  postTitle: string;
  postUrl: string;
  currentUserId?: string;
  showReactions?: boolean;
  showComments?: boolean;
  showBookmark?: boolean;
  showShare?: boolean;
}

const REACTION_ICONS = {
  like: ThumbsUp,
  love: Heart,
  clap: Award,
  insightful: MessageCircle,
};

const REACTION_LABELS = {
  like: 'Like',
  love: 'Love',
  clap: 'Clap',
  insightful: 'Insightful',
};

/**
 * Blog Engagement Component
 *
 * Complete reader engagement system with:
 * - Multi-type reactions (like, love, clap, insightful)
 * - Nested/threaded comments
 * - Bookmark functionality
 * - Social sharing
 * - Comment editing/deletion
 * - Reply threading
 */
export default function BlogEngagement({
  postId,
  postTitle,
  postUrl,
  currentUserId,
  showReactions = true,
  showComments = true,
  showBookmark = true,
  showShare = true,
}: BlogEngagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Fetch reactions
  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: ['/api/blog/posts', postId, 'reactions'],
    enabled: showReactions,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/blog/posts', postId, 'comments'],
    enabled: showComments,
  });

  // Check if user has bookmarked
  const { data: bookmarks = [] } = useQuery<any[]>({
    queryKey: ['/api/blog/bookmarks'],
    enabled: showBookmark && !!currentUserId,
  });

  const isBookmarked = bookmarks.some((b: any) => b.postId === postId);

  // Get user's reactions
  const userReactions = reactions.filter((r) => r.userId === currentUserId);

  // Aggregate reaction counts
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reactionType] = (acc[r.reactionType] || 0) + r.count;
    return acc;
  }, {} as Record<string, number>);

  // Add/update reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async ({ type, count = 1 }: { type: string; count?: number }) => {
      const response = await fetch(`/api/blog/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type, count }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', postId, 'reactions'] });
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/blog/posts/${postId}/reactions/${type}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', postId, 'reactions'] });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const response = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          parentCommentId: parentId || null,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', postId, 'comments'] });
      setCommentText('');
      setReplyingTo(null);
      toast({ title: 'Comment posted!' });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await fetch(`/api/blog/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', postId, 'comments'] });
      setEditingComment(null);
      setEditText('');
      toast({ title: 'Comment updated!' });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/blog/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', postId, 'comments'] });
      toast({ title: 'Comment deleted!' });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      const method = action === 'add' ? 'POST' : 'DELETE';
      const response = await fetch(`/api/blog/posts/${postId}/bookmark`, {
        method,
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/bookmarks'] });
      toast({
        title: isBookmarked ? 'Bookmark removed' : 'Bookmarked!',
        description: isBookmarked ? undefined : 'Saved to your reading list',
      });
    },
  });

  const handleReaction = (type: string) => {
    if (!currentUserId) {
      toast({ title: 'Please sign in to react', variant: 'destructive' });
      return;
    }

    const existingReaction = userReactions.find((r) => r.reactionType === type);
    if (existingReaction) {
      removeReactionMutation.mutate(type);
    } else {
      reactionMutation.mutate({ type });
    }
  };

  const handleComment = () => {
    if (!currentUserId) {
      toast({ title: 'Please sign in to comment', variant: 'destructive' });
      return;
    }
    if (!commentText.trim()) return;

    createCommentMutation.mutate({
      content: commentText,
      parentId: replyingTo || undefined,
    });
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(postUrl);
    const encodedTitle = encodeURIComponent(postTitle);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=Check out this article: ${encodedUrl}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(postUrl);
      toast({ title: 'Link copied to clipboard!' });
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="space-y-6">
      {/* Reactions Bar */}
      {showReactions && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Object.entries(REACTION_ICONS).map(([type, Icon]) => {
                  const count = reactionCounts[type] || 0;
                  const userHasReacted = userReactions.some((r) => r.reactionType === type);

                  return (
                    <Button
                      key={type}
                      variant={userHasReacted ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleReaction(type)}
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{REACTION_LABELS[type as keyof typeof REACTION_LABELS]}</span>
                      {count > 0 && <Badge variant="secondary">{count}</Badge>}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {/* Bookmark Button */}
                {showBookmark && (
                  <Button
                    variant={isBookmarked ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => bookmarkMutation.mutate(isBookmarked ? 'remove' : 'add')}
                    disabled={!currentUserId}
                  >
                    <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
                  </Button>
                )}

                {/* Share Button */}
                {showShare && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share this post</DialogTitle>
                        <DialogDescription>
                          Share this article with your network
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleShare('twitter')}
                        >
                          <Twitter className="w-4 h-4 mr-2" />
                          Share on Twitter
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleShare('facebook')}
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Share on Facebook
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleShare('linkedin')}
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          Share on LinkedIn
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleShare('email')}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Share via Email
                        </Button>
                        <Separator />
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleShare('copy')}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      {showComments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Input */}
            {currentUserId ? (
              <div className="space-y-2">
                <Textarea
                  placeholder={replyingTo ? 'Write a reply...' : 'Share your thoughts...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  {replyingTo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setCommentText('');
                      }}
                    >
                      Cancel Reply
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button
                    onClick={handleComment}
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Please sign in to leave a comment
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments
                .filter((c) => !c.parentCommentId) // Top-level comments only
                .map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={postId}
                    currentUserId={currentUserId}
                    allComments={comments}
                    onReply={(id) => {
                      setReplyingTo(id);
                      setCommentText('');
                    }}
                    onEdit={(id, content) => {
                      setEditingComment(id);
                      setEditText(content);
                    }}
                    onDelete={(id) => deleteCommentMutation.mutate(id)}
                    onUpdate={(id, content) =>
                      updateCommentMutation.mutate({ commentId: id, content })
                    }
                    editingComment={editingComment}
                    editText={editText}
                    setEditText={setEditText}
                    setEditingComment={setEditingComment}
                  />
                ))}
            </div>

            {comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet. Be the first to share your thoughts!
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  allComments: Comment[];
  onReply: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  editingComment: string | null;
  editText: string;
  setEditText: (text: string) => void;
  setEditingComment: (id: string | null) => void;
  depth?: number;
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  allComments,
  onReply,
  onEdit,
  onDelete,
  onUpdate,
  editingComment,
  editText,
  setEditText,
  setEditingComment,
  depth = 0,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isEditing = editingComment === comment.id;
  const isAuthor = currentUserId === comment.authorId;

  const replies = allComments.filter((c) => c.parentCommentId === comment.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-8 pl-4 border-l-2')}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.author.profileImageUrl} />
          <AvatarFallback>
            {comment.author.firstName[0]}
            {comment.author.lastName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">
                {comment.author.firstName} {comment.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
                {comment.isEdited && ' (edited)'}
              </p>
            </div>

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(comment.id, comment.content)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onUpdate(comment.id, editText)}>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingComment(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <button
                  onClick={() => onReply(comment.id)}
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>

                {replies.length > 0 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {showReplies ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              allComments={allComments}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
              editingComment={editingComment}
              editText={editText}
              setEditText={setEditText}
              setEditingComment={setEditingComment}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

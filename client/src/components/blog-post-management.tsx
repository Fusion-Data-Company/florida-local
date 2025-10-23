import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Eye,
  EyeOff,
  Save,
  Clock,
  Tag,
  Image as ImageIcon,
  FileText,
  Globe,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Zod schema for blog post form
const blogPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  categoryId: z.string().uuid().optional().nullable(),
  featuredImageUrl: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  scheduledAt: z.string().datetime().optional().nullable(),
  allowComments: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  // SEO fields
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  metaKeywords: z.array(z.string()).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface BlogPostManagementProps {
  postId?: string; // Optional: for editing existing post
  onSave?: (postId: string) => void;
  onCancel?: () => void;
}

/**
 * Blog Post Management Component
 *
 * Complete post creation/editing interface with:
 * - Title, slug, excerpt, content (uses BlogEditor)
 * - Category & tag management
 * - Featured image upload
 * - SEO optimization fields
 * - Publication scheduling
 * - Draft/Published/Scheduled status
 * - Preview mode
 */
export default function BlogPostManagement({
  postId,
  onSave,
  onCancel,
}: BlogPostManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch existing post data if editing
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['/api/blog/posts', postId],
    enabled: !!postId,
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ['/api/blog/categories'],
  });

  // Initialize form
  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: post || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      categoryId: null,
      featuredImageUrl: null,
      status: 'draft',
      scheduledAt: null,
      allowComments: true,
      isFeatured: false,
      isPinned: false,
      metaTitle: null,
      metaDescription: null,
      metaKeywords: null,
      canonicalUrl: null,
      ogImage: null,
    },
  });

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);

    if (!postId) { // Only auto-generate slug for new posts
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue('slug', slug);
    }
  };

  // Tag management
  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const url = postId ? `/api/blog/posts/${postId}` : '/api/blog/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags, // Include tags array
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      toast({
        title: postId ? 'Post updated' : 'Post created',
        description: `Your blog post has been ${postId ? 'updated' : 'created'} successfully.`,
      });
      onSave?.(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      toast({
        title: 'Post deleted',
        description: 'Your blog post has been deleted successfully.',
      });
      onCancel?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: BlogPostFormData) => {
    saveMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const status = form.watch('status');
  const isFeatured = form.watch('isFeatured');
  const isPinned = form.watch('isPinned');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {postId ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="text-muted-foreground">
            {postId ? 'Update your existing blog post' : 'Write and publish a new blog post'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'draft' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Draft
            </Badge>
          )}
          {status === 'scheduled' && (
            <Badge variant="default" className="flex items-center gap-1 bg-blue-500">
              <Clock className="w-3 h-3" />
              Scheduled
            </Badge>
          )}
          {status === 'published' && (
            <Badge variant="default" className="flex items-center gap-1 bg-green-500">
              <CheckCircle className="w-3 h-3" />
              Published
            </Badge>
          )}
          {status === 'archived' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Archived
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>Basic information about your blog post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your blog post title"
                    {...form.register('title')}
                    onChange={handleTitleChange}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="url-friendly-slug"
                    {...form.register('slug')}
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /blog/{form.watch('slug') || 'your-post-slug'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="A brief summary of your post (max 500 characters)"
                    rows={3}
                    maxLength={500}
                    {...form.register('excerpt')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch('excerpt')?.length || 0} / 500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor (TipTap) */}
            <Card>
              <CardHeader>
                <CardTitle>Content *</CardTitle>
                <CardDescription>Write your blog post content using the rich text editor</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your blog post content here... (Note: Use BlogEditor component for rich text)"
                  rows={15}
                  {...form.register('content')}
                  className="font-mono text-sm"
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.content.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Note: In production, this would use the BlogEditor component with TipTap for rich text editing.
                </p>
              </CardContent>
            </Card>

            {/* SEO Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  SEO Optimization
                </CardTitle>
                <CardDescription>Optimize your post for search engines</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic SEO</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        placeholder="SEO-optimized title (max 60 chars)"
                        maxLength={60}
                        {...form.register('metaTitle')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.watch('metaTitle')?.length || 0} / 60 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        placeholder="Brief description for search results (max 160 chars)"
                        rows={3}
                        maxLength={160}
                        {...form.register('metaDescription')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.watch('metaDescription')?.length || 0} / 160 characters
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="canonicalUrl">Canonical URL</Label>
                      <Input
                        id="canonicalUrl"
                        type="url"
                        placeholder="https://example.com/original-post"
                        {...form.register('canonicalUrl')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use if this content is published elsewhere
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="ogImage">Open Graph Image</Label>
                      <Input
                        id="ogImage"
                        type="url"
                        placeholder="https://example.com/og-image.jpg"
                        {...form.register('ogImage')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Image for social media sharing (1200x630px recommended)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {status === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      {...form.register('scheduledAt')}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowComments">Allow Comments</Label>
                  <Switch
                    id="allowComments"
                    checked={form.watch('allowComments')}
                    onCheckedChange={(checked) => form.setValue('allowComments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Featured Post</Label>
                  <Switch
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={(checked) => form.setValue('isFeatured', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isPinned">Pin to Top</Label>
                  <Switch
                    id="isPinned"
                    checked={isPinned}
                    onCheckedChange={(checked) => form.setValue('isPinned', checked)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.watch('categoryId') || undefined}
                  onValueChange={(value) => form.setValue('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Featured Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...form.register('featuredImageUrl')}
                />
                {form.watch('featuredImageUrl') && (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={form.watch('featuredImageUrl') || ''}
                      alt="Featured"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {postId && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your blog post.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

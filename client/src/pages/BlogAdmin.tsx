import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  BarChart3,
  FileText,
  Settings,
  Download,
  Upload,
  Save,
  Send,
  X
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BlogEditor from "@/components/blog-editor";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  SelectBlogPost, 
  SelectBlogCategory, 
  SelectBlogTag,
  InsertBlogPost,
  UpdateBlogPost
} from "@shared/schema";

export default function BlogAdmin() {
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingPost, setEditingPost] = useState<SelectBlogPost | null>(null);
  const [newPost, setNewPost] = useState(false);
  const [postForm, setPostForm] = useState<Partial<InsertBlogPost>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    status: "draft",
    featuredImage: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image"
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery<{
    posts: SelectBlogPost[];
    total: number;
  }>({
    queryKey: ['/api/blog/posts', searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '20');
      
      const response = await fetch(`/api/blog/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories } = useQuery<SelectBlogCategory[]>({
    queryKey: ['/api/blog/categories']
  });

  // Fetch tags
  const { data: tags } = useQuery<SelectBlogTag[]>({
    queryKey: ['/api/blog/tags']
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      return apiRequest('/api/blog/posts', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      setNewPost(false);
      resetForm();
      
      // Attach tags if any selected
      if (selectedTags.length > 0) {
        attachTagsMutation.mutate({ postId: newPost.id, tagIds: selectedTags });
      }
      
      toast({
        title: "Post created!",
        description: "Your blog post has been created successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create post",
        description: "Please try again later.",
      });
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBlogPost }) => {
      return apiRequest('/api/blog/posts/' + id, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      setEditingPost(null);
      resetForm();
      toast({
        title: "Post updated!",
        description: "Your blog post has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to update post",
        description: "Please try again later.",
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('/api/blog/posts/' + postId, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      toast({
        title: "Post deleted",
        description: "The blog post has been deleted.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to delete post",
        description: "Please try again later.",
      });
    }
  });

  // Attach tags mutation
  const attachTagsMutation = useMutation({
    mutationFn: async ({ postId, tagIds }: { postId: string; tagIds: string[] }) => {
      return apiRequest('/api/blog/posts/' + postId + '/tags', {
        method: 'POST',
        body: { tagIds }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      return apiRequest('/api/blog/categories', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      toast({
        title: "Category created!",
        description: "The category has been created successfully.",
      });
    }
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      return apiRequest('/api/blog/tags', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/tags'] });
      toast({
        title: "Tag created!",
        description: "The tag has been created successfully.",
      });
    }
  });

  const resetForm = () => {
    setPostForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      status: "draft",
      featuredImage: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterCard: "summary_large_image"
    });
    setSelectedTags([]);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleSubmit = () => {
    if (!postForm.title || !postForm.content) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please provide a title and content for the post.",
      });
      return;
    }

    const data = {
      ...postForm,
      slug: postForm.slug || generateSlug(postForm.title),
      categoryId: postForm.categoryId || undefined,
    } as InsertBlogPost;

    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data: data as UpdateBlogPost });
    } else {
      createPostMutation.mutate(data);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Blog Admin</h1>
            <p className="text-muted-foreground">Manage your blog content and settings</p>
          </div>
          <Button onClick={() => setNewPost(true)} data-testid="button-new-post">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts" data-testid="tab-posts">
              <FileText className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              Categories
            </TabsTrigger>
            <TabsTrigger value="tags" data-testid="tab-tags">
              Tags
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Blog Posts</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search posts..."
                      className="w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-posts"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32" data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postsData?.posts?.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          <Link href={`/blog/${post.slug}`}>
                            <a className="hover:text-primary" data-testid={`text-post-title-${post.id}`}>
                              {post.title}
                            </a>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === post.categoryId)?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.publishedAt ? formatDate(post.publishedAt) : '-'}
                        </TableCell>
                        <TableCell>{post.viewCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPost(post);
                                setPostForm(post);
                                setNewPost(true);
                              }}
                              data-testid={`button-edit-${post.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePostMutation.mutate(post.id)}
                              data-testid={`button-delete-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Input
                      placeholder="Category name"
                      id="new-category-name"
                      data-testid="input-new-category"
                    />
                    <Input
                      placeholder="Slug (optional)"
                      id="new-category-slug"
                      data-testid="input-new-category-slug"
                    />
                    <Button
                      onClick={() => {
                        const nameInput = document.getElementById('new-category-name') as HTMLInputElement;
                        const slugInput = document.getElementById('new-category-slug') as HTMLInputElement;
                        const name = nameInput.value;
                        const slug = slugInput.value || generateSlug(name);
                        
                        if (name) {
                          createCategoryMutation.mutate({ name, slug });
                          nameInput.value = '';
                          slugInput.value = '';
                        }
                      }}
                      data-testid="button-add-category"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {categories?.map((category) => (
                      <div key={category.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.slug}</p>
                        </div>
                        <Badge>{category.postCount || 0} posts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Input
                      placeholder="Tag name"
                      id="new-tag-name"
                      data-testid="input-new-tag"
                    />
                    <Input
                      placeholder="Slug (optional)"
                      id="new-tag-slug"
                      data-testid="input-new-tag-slug"
                    />
                    <Button
                      onClick={() => {
                        const nameInput = document.getElementById('new-tag-name') as HTMLInputElement;
                        const slugInput = document.getElementById('new-tag-slug') as HTMLInputElement;
                        const name = nameInput.value;
                        const slug = slugInput.value || generateSlug(name);
                        
                        if (name) {
                          createTagMutation.mutate({ name, slug });
                          nameInput.value = '';
                          slugInput.value = '';
                        }
                      }}
                      data-testid="button-add-tag"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tag
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="px-3 py-1">
                        {tag.name} ({tag.usageCount || 0})
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{postsData?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {postsData?.posts?.filter(p => p.status === 'published').length || 0} published
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {postsData?.posts?.reduce((sum, post) => sum + (post.viewCount || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {postsData?.posts?.reduce((sum, post) => sum + (post.likeCount || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total likes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {postsData?.posts?.reduce((sum, post) => sum + (post.commentCount || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total comments</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Shares</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postsData?.posts
                      ?.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                      .slice(0, 5)
                      .map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <Link href={`/blog/${post.slug}`}>
                              <a className="hover:text-primary">
                                {post.title}
                              </a>
                            </Link>
                          </TableCell>
                          <TableCell>{post.viewCount}</TableCell>
                          <TableCell>{post.likeCount}</TableCell>
                          <TableCell>{post.commentCount}</TableCell>
                          <TableCell>{post.shareCount}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Post Dialog */}
        <Dialog open={newPost} onOpenChange={(open) => {
          if (!open) {
            setNewPost(false);
            setEditingPost(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="Enter post title"
                    data-testid="input-post-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={postForm.slug}
                    onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                    placeholder="post-slug"
                    data-testid="input-post-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={3}
                  data-testid="textarea-post-excerpt"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={postForm.categoryId}
                    onValueChange={(value) => setPostForm({ ...postForm, categoryId: value })}
                  >
                    <SelectTrigger id="category" data-testid="select-post-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={postForm.status}
                    onValueChange={(value) => setPostForm({ ...postForm, status: value as any })}
                  >
                    <SelectTrigger id="status" data-testid="select-post-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag.id)
                            ? prev.filter(t => t !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                      data-testid={`badge-select-tag-${tag.id}`}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured-image">Featured Image URL</Label>
                <Input
                  id="featured-image"
                  value={postForm.featuredImage}
                  onChange={(e) => setPostForm({ ...postForm, featuredImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-featured-image"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <BlogEditor
                  content={postForm.content || ''}
                  onChange={(content) => setPostForm({ ...postForm, content })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">SEO Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta-title">Meta Title</Label>
                    <Input
                      id="meta-title"
                      value={postForm.metaTitle}
                      onChange={(e) => setPostForm({ ...postForm, metaTitle: e.target.value })}
                      placeholder="SEO title"
                      data-testid="input-meta-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="canonical-url">Canonical URL</Label>
                    <Input
                      id="canonical-url"
                      value={postForm.canonicalUrl}
                      onChange={(e) => setPostForm({ ...postForm, canonicalUrl: e.target.value })}
                      placeholder="https://example.com/post"
                      data-testid="input-canonical-url"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    value={postForm.metaDescription}
                    onChange={(e) => setPostForm({ ...postForm, metaDescription: e.target.value })}
                    placeholder="SEO description"
                    rows={2}
                    data-testid="textarea-meta-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-keywords">Meta Keywords</Label>
                  <Input
                    id="meta-keywords"
                    value={postForm.metaKeywords}
                    onChange={(e) => setPostForm({ ...postForm, metaKeywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3"
                    data-testid="input-meta-keywords"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="og-title">Open Graph Title</Label>
                    <Input
                      id="og-title"
                      value={postForm.ogTitle}
                      onChange={(e) => setPostForm({ ...postForm, ogTitle: e.target.value })}
                      placeholder="Social media title"
                      data-testid="input-og-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og-image">Open Graph Image</Label>
                    <Input
                      id="og-image"
                      value={postForm.ogImage}
                      onChange={(e) => setPostForm({ ...postForm, ogImage: e.target.value })}
                      placeholder="https://example.com/og-image.jpg"
                      data-testid="input-og-image"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og-description">Open Graph Description</Label>
                  <Textarea
                    id="og-description"
                    value={postForm.ogDescription}
                    onChange={(e) => setPostForm({ ...postForm, ogDescription: e.target.value })}
                    placeholder="Social media description"
                    rows={2}
                    data-testid="textarea-og-description"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewPost(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} data-testid="button-save-post">
                {editingPost ? 'Update' : 'Create'} Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
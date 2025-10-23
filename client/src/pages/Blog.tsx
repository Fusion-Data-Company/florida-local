import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Search,
  Filter,
  TrendingUp,
  BookOpen,
  Tag,
  User,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { SelectBlogPost, SelectBlogCategory, SelectBlogTag } from "@shared/schema";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const { toast } = useToast();

  // Fetch blog posts
  const { data: postsData, isLoading: postsLoading } = useQuery<{
    posts: SelectBlogPost[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['/api/blog/posts', searchQuery, selectedCategory, selectedTags, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedTags.length) params.append('tags', selectedTags.join(','));
      params.append('sort', sortBy);
      params.append('status', 'published');
      params.append('limit', '12');
      
      const response = await fetch(`/api/blog/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  // Fetch popular posts
  const { data: popularPosts } = useQuery<SelectBlogPost[]>({
    queryKey: ['/api/blog/posts/popular'],
    queryFn: async () => {
      const response = await fetch('/api/blog/posts/popular?limit=5');
      if (!response.ok) throw new Error('Failed to fetch popular posts');
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

  // Subscribe to newsletter
  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/blog/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          type: 'newsletter',
          preferences: ['new_posts', 'weekly_digest'] 
        })
      });
      if (!response.ok) throw new Error('Subscription failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "You've been subscribed to our blog newsletter.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Subscription failed",
        description: "Please try again later.",
      });
    }
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-7xl mx-auto text-center"
        >
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            The Florida Local Blog
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Insights, tips, and stories for Florida businesses. Stay informed about local trends, marketing strategies, and business growth.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-12 pr-4 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-blog-search"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories?.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "secondary"}
                className="cursor-pointer px-4 py-2"
                onClick={() => setSelectedCategory(category.id === selectedCategory ? "" : category.id)}
                data-testid={`badge-category-${category.id}`}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Blog Posts */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Latest Articles</h2>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts Grid */}
            {postsLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-48 mb-4" />
                      <Skeleton className="h-6 mb-2" />
                      <Skeleton className="h-4 mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {postsData?.posts?.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      {post.featuredImage && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex gap-2 mb-2">
                          {post.categoryId && (
                            <Badge variant="secondary" data-testid={`text-category-${post.id}`}>
                              {categories?.find(c => c.id === post.categoryId)?.name}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2">
                          <Link href={`/blog/${post.slug}`}>
                            <a className="hover:text-primary transition-colors" data-testid={`link-post-${post.id}`}>
                              {post.title}
                            </a>
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.publishedAt || post.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {calculateReadTime(post.content || '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.commentCount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/blog/${post.slug}`}>
                          <Button variant="ghost" className="w-full" data-testid={`button-read-${post.id}`}>
                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {postsData && postsData.total > postsData.limit && (
              <div className="flex justify-center mt-8 gap-2">
                {[...Array(Math.ceil(postsData.total / postsData.limit))].map((_, i) => (
                  <Button
                    key={i}
                    variant={postsData.page === i + 1 ? "default" : "outline"}
                    size="sm"
                    data-testid={`button-page-${i + 1}`}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Newsletter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Newsletter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the latest business insights delivered to your inbox.
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const email = (e.target as any).email.value;
                  subscribeMutation.mutate(email);
                }}>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="mb-3"
                    required
                    data-testid="input-newsletter-email"
                  />
                  <Button type="submit" className="w-full" data-testid="button-subscribe">
                    Subscribe
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Popular Posts */}
            {popularPosts && popularPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Popular Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <Link key={post.id} href={`/blog/${post.slug}`}>
                        <a className="flex gap-3 group" data-testid={`link-popular-${post.id}`}>
                          <span className="text-2xl font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {post.viewCount} views • {calculateReadTime(post.content || '')}
                            </p>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags Cloud */}
            {tags && tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 15).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag.id) 
                              ? prev.filter(t => t !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                        data-testid={`badge-tag-${tag.id}`}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
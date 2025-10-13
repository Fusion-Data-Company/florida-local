import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Search,
  TrendingUp,
  Tag,
  User,
  BookOpen,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Rss,
  Filter,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl?: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readTimeMinutes: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface BlogDiscoveryProps {
  currentPostId?: string; // For related posts
  showRelated?: boolean;
  showTrending?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
  showRSS?: boolean;
  className?: string;
}

/**
 * Blog Discovery Component
 *
 * Comprehensive content discovery system with:
 * - Related posts based on tags/category
 * - Trending articles by engagement
 * - Search with filters
 * - Category browser
 * - Tag cloud
 * - Author profiles
 * - RSS feed links
 */
export default function BlogDiscovery({
  currentPostId,
  showRelated = true,
  showTrending = true,
  showSearch = true,
  showCategories = true,
  showTags = true,
  showRSS = true,
  className = '',
}: BlogDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('publishedAt');

  // Fetch related posts (if currentPostId provided)
  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts', currentPostId, 'related'],
    enabled: showRelated && !!currentPostId,
  });

  // Fetch trending posts
  const { data: trendingPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts', { featured: true, limit: 5, orderBy: 'viewCount' }],
    enabled: showTrending,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/blog/categories'],
    enabled: showCategories,
  });

  // Fetch popular tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/blog/tags', { popular: true, limit: 30 }],
    enabled: showTags,
  });

  // Search posts
  const { data: searchResults = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts', {
      q: searchQuery,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      orderBy: sortBy,
      limit: 20,
    }],
    enabled: searchQuery.length >= 3,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getAuthorInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Section */}
      {showSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Blog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {searchQuery.length >= 3 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="flex items-center gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="publishedAt">Newest</SelectItem>
                        <SelectItem value="viewCount">Popular</SelectItem>
                        <SelectItem value="likeCount">Most Liked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                        <h4 className="font-medium mb-1">{post.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTimeMinutes} min
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Posts */}
      {showRelated && currentPostId && relatedPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Related Posts
            </CardTitle>
            <CardDescription>Similar content you might enjoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="flex gap-3 group cursor-pointer">
                    {post.featuredImageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={post.featuredImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>•</span>
                        <span>{post.readTimeMinutes} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Posts */}
      {showTrending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Now
            </CardTitle>
            <CardDescription>Most popular posts this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendingPosts.map((post, index) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="flex gap-3 group cursor-pointer">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Separator className="my-4" />
            <Link href="/blog/trending">
              <Button variant="ghost" className="w-full">
                View All Trending
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {showCategories && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Categories
            </CardTitle>
            <CardDescription>Browse by topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <Link key={category.id} href={`/blog/category/${category.slug}`}>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors group">
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {category.name}
                      </span>
                    </div>
                    <Badge variant="secondary">{category.postCount}</Badge>
                  </div>
                </Link>
              ))}
            </div>
            <Separator className="my-4" />
            <Link href="/blog/categories">
              <Button variant="ghost" className="w-full">
                View All Categories
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tag Cloud */}
      {showTags && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    style={{
                      fontSize: `${Math.min(14 + tag.postCount / 5, 18)}px`,
                    }}
                  >
                    #{tag.name} ({tag.postCount})
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RSS Feed */}
      {showRSS && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="w-5 h-5" />
              Subscribe
            </CardTitle>
            <CardDescription>Stay updated with our latest posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/blog/rss.xml">
              <Button variant="outline" className="w-full">
                <Rss className="w-4 h-4 mr-2" />
                RSS Feed
              </Button>
            </Link>
            <Link href="/blog/subscribe">
              <Button className="w-full">
                Subscribe via Email
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Author Spotlight (Optional - if you want to showcase authors) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Featured Authors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would be dynamically populated */}
            <div className="text-center text-sm text-muted-foreground py-4">
              Author spotlights coming soon
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact version for sidebars
 */
export function BlogDiscoverySidebar({ currentPostId }: { currentPostId?: string }) {
  return (
    <BlogDiscovery
      currentPostId={currentPostId}
      showRelated={true}
      showTrending={true}
      showSearch={false}
      showCategories={true}
      showTags={true}
      showRSS={true}
      className="max-w-sm"
    />
  );
}

/**
 * Full page discovery experience
 */
export function BlogDiscoveryPage() {
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Content</h1>
        <p className="text-muted-foreground">
          Explore our blog posts, find what interests you
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BlogDiscovery
            showRelated={false}
            showSearch={true}
            showCategories={true}
            showTags={true}
            showTrending={false}
            showRSS={false}
          />
        </div>
        <div className="lg:col-span-1">
          <BlogDiscovery
            showRelated={false}
            showSearch={false}
            showCategories={false}
            showTags={false}
            showTrending={true}
            showRSS={true}
          />
        </div>
      </div>
    </div>
  );
}

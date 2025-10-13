import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Package,
  MessageSquare,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ContentData {
  blogPosts: {
    items: any[];
    total: number;
  };
  posts: {
    items: any[];
    total: number;
  };
  products: {
    items: any[];
    total: number;
  };
}

export function ContentModerationSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contentType, setContentType] = useState("all");

  const { data: content, isLoading } = useQuery<ContentData>({
    queryKey: ["/api/admin/content"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading content...</div>
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">No content available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{content.blogPosts.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Posts</CardTitle>
            <MessageSquare className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{content.posts.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{content.products.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total products</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Review and moderate platform content</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="blog-posts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="blog-posts">Blog Posts</TabsTrigger>
              <TabsTrigger value="business-posts">Business Posts</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="blog-posts" className="space-y-4">
              {content.blogPosts.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No blog posts found
                </div>
              ) : (
                content.blogPosts.items.slice(0, 20).map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{post.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {post.excerpt || post.content?.substring(0, 150)}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={post.status === "published" ? "default" : "secondary"}>
                              {post.status}
                            </Badge>
                            {post.featured && <Badge variant="outline">Featured</Badge>}
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="business-posts" className="space-y-4">
              {content.posts.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No business posts found
                </div>
              ) : (
                content.posts.items.slice(0, 20).map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={post.isVisible ? "default" : "secondary"}>
                              {post.isVisible ? "Visible" : "Hidden"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {post.likeCount || 0} likes • {post.commentCount || 0} comments
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              {content.products.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              ) : (
                content.products.items.slice(0, 20).map((product) => (
                  <Card key={product.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{product.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {product.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="font-bold text-green-600">
                                  ${product.price}
                                </span>
                                {product.category && (
                                  <Badge variant="outline">{product.category}</Badge>
                                )}
                                <Badge variant={product.isActive ? "default" : "secondary"}>
                                  {product.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Stock: {product.stockQuantity || 0}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

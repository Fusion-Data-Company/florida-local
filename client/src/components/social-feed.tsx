import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Post, insertPostSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ActivityPost from "./activity-post";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon } from "lucide-react";

const createPostSchema = insertPostSchema.omit({ id: true }).extend({
  content: z.string().min(1, "Post content is required").max(2000, "Post content must be less than 2000 characters"),
  type: z.enum(["update", "achievement", "partnership", "product"]).default("update"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });

  const { data: userBusinesses = [] } = useQuery({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
      type: "update",
      businessId: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      return await apiRequest('POST', '/api/posts', data);
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: "Your post has been shared with the community.",
      });
      form.reset();
      setIsCreatePostOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostForm) => {
    if (!data.businessId) {
      toast({
        title: "Business required",
        description: "Please select a business to post from.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(data);
  };

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 gradient-text">
              Community Activity
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Stay connected with what's happening in your local business community. 
              See updates, celebrate successes, and discover opportunities.
            </p>
          </div>

          {/* Create Post Section */}
          {isAuthenticated && userBusinesses.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user?.firstName?.[0] || 'U'}
                    </span>
                  </div>
                  <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 justify-start text-muted-foreground"
                        data-testid="button-create-post"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Share an update with the community...
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Post</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="businessId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Post as</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-business">
                                      <SelectValue placeholder="Select your business" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {userBusinesses.map((business: any) => (
                                      <SelectItem key={business.id} value={business.id}>
                                        {business.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Post Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-post-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="update">General Update</SelectItem>
                                    <SelectItem value="achievement">Achievement</SelectItem>
                                    <SelectItem value="partnership">Partnership</SelectItem>
                                    <SelectItem value="product">New Product</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="What's happening with your business?"
                                    className="min-h-32"
                                    data-testid="textarea-post-content"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex items-center justify-between">
                            <Button type="button" variant="outline" size="sm">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Add Images
                            </Button>
                            <div className="flex space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreatePostOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createPostMutation.isPending}
                                data-testid="button-submit-post"
                              >
                                {createPostMutation.isPending ? "Posting..." : "Share Post"}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <div className="space-y-6">
            {isLoading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border shadow-lg p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/6" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                  <Skeleton className="h-48 w-full mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-6">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))
            ) : posts.length > 0 ? (
              posts.slice(0, 5).map((post: Post) => (
                <ActivityPost key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-16">
                <i className="fas fa-stream text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share an update with the community!
                </p>
                {isAuthenticated && userBusinesses.length > 0 && (
                  <Button 
                    onClick={() => setIsCreatePostOpen(true)}
                    data-testid="button-create-first-post"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {posts.length > 5 && (
            <div className="text-center mt-12">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all"
                data-testid="button-load-more-posts"
              >
                Load More Updates
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

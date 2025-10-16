import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Post, Business, insertPostSchema } from "@shared/types";
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
import { Plus, Image as ImageIcon, MessageSquare, TrendingUp } from "lucide-react";
import { LiquidGlassHeaderCard, GlassFilter } from "@/components/ui/liquid-glass";

const createPostSchema = insertPostSchema.extend({
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

  const { data: userBusinesses = [] } = useQuery<Business[]>({
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
    <section className="elite-feed-section py-20">
      {/* Glass Filter for Liquid Glass Effect */}
      <GlassFilter />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 entrance-fade-up">
            <LiquidGlassHeaderCard
              title="Community Activity"
              subtitle="Stay connected with what's happening in your local business community. See updates, celebrate successes, and discover opportunities."
            />
          </div>

          {/* Create Post Section */}
          {isAuthenticated && userBusinesses.length > 0 && (
            <div className="elite-create-post-card mb-8">
              <div className="elite-post-marble-overlay"></div>
              <div className="relative z-10 p-6">
                <div className="flex items-center space-x-4">
                  <div className="elite-post-avatar-frame">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center relative overflow-hidden">
                      <span className="text-primary-foreground font-semibold relative z-10">
                        {user?.firstName?.[0] || 'U'}
                      </span>
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    </div>
                  </div>
                  <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="elite-create-post-input flex-1 justify-start"
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
                                    {userBusinesses.map((business) => (
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
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="elite-feed-container space-y-6">
            {isLoading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="elite-post-card elite-post-skeleton">
                  <div className="elite-post-marble-overlay"></div>
                  <div className="relative z-10">
                    <div className="flex items-start space-x-4 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                    <Skeleton className="h-48 w-full mb-4 rounded-lg" />
                    <div className="flex items-center justify-between pt-4 border-t elite-post-divider">
                      <div className="flex space-x-6">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                </div>
              ))
            ) : posts.length > 0 ? (
              posts.slice(0, 5).map((post: Post) => (
                <ActivityPost key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <MessageSquare className="text-6xl text-muted-foreground mx-auto" size={64} />
                  <div className="absolute inset-0 text-muted-foreground opacity-20 blur-lg"></div>
                </div>
                <h3 className="text-2xl font-bold mb-4 gradient-text text-luxury font-serif">No activity yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
                className="metallic hover-lift btn-press px-8 py-4 font-semibold group transition-all duration-300 shadow-sm"
                data-testid="button-load-more-posts"
              >
                <TrendingUp className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Load More Updates</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

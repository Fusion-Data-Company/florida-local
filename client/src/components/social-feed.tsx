import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import ActivityPost from "./activity-post";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SocialFeed() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });

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
                <p className="text-muted-foreground">
                  Be the first to share an update with the community!
                </p>
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

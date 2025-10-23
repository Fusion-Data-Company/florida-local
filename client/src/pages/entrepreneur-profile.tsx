import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Building2,
  Trophy,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  MessageSquare,
  UserPlus,
  UserMinus,
  Edit,
  Share2,
  Award,
  Target,
  Briefcase,
  Clock,
  Zap,
  Rocket,
  Heart,
  Eye,
  ChevronRight,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Business } from "@shared/types";

interface EntrepreneurProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  title: string;
  location: string;
  website?: string;
  email?: string;
  phone?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  skills: string[];
  experience: number; // years
  achievements: Achievement[];
  businesses: Business[];
  stats: {
    totalBusinesses: number;
    totalFollowers: number;
    totalRevenue: number;
    successRate: number;
    spotlightWins: number;
    avgRating: number;
  };
  createdAt: string;
  updatedAt: string;
  verified: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface TimelinePost {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  businessId?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export default function EntrepreneurProfile() {
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = user?.id === id;

  // Fetch entrepreneur profile
  const { data: profile, isLoading } = useQuery<EntrepreneurProfile>({
    queryKey: ['/api/entrepreneurs', id],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/entrepreneurs/${id}`);
      } catch (error) {
        // Return mock data for now
        return {
          id,
          userId: id,
          displayName: user?.firstName || "John Entrepreneur",
          bio: "Serial entrepreneur passionate about building innovative businesses in Florida. Focused on creating value for local communities through technology and sustainable practices.",
          title: "Founder & CEO",
          location: "Miami, Florida",
          website: "https://example.com",
          email: "john@example.com",
          phone: "+1 (305) 555-0100",
          socialLinks: {
            linkedin: "https://linkedin.com/in/john",
            twitter: "https://twitter.com/john",
            instagram: "https://instagram.com/john",
            facebook: "https://facebook.com/john"
          },
          skills: ["Business Strategy", "Digital Marketing", "E-commerce", "Team Building", "Innovation", "Leadership"],
          experience: 8,
          achievements: [
            {
              id: "1",
              title: "Spotlight Champion",
              description: "Won monthly spotlight 3 times",
              icon: "trophy",
              earnedAt: new Date().toISOString(),
              rarity: "epic"
            },
            {
              id: "2",
              title: "Community Leader",
              description: "Helped 50+ businesses grow",
              icon: "users",
              earnedAt: new Date().toISOString(),
              rarity: "rare"
            },
            {
              id: "3",
              title: "Revenue Master",
              description: "Generated $1M+ in platform sales",
              icon: "dollar",
              earnedAt: new Date().toISOString(),
              rarity: "legendary"
            }
          ],
          businesses: [],
          stats: {
            totalBusinesses: 3,
            totalFollowers: 1234,
            totalRevenue: 1250000,
            successRate: 92,
            spotlightWins: 3,
            avgRating: 4.8
          },
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          verified: true
        };
      }
    },
  });

  // Fetch user's businesses
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/entrepreneurs', id, 'businesses'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/entrepreneurs/${id}/businesses`);
      } catch (error) {
        // Fetch from regular businesses API
        return await apiRequest('GET', `/api/users/${id}/businesses`);
      }
    },
  });

  // Fetch timeline posts
  const { data: timeline = [] } = useQuery<TimelinePost[]>({
    queryKey: ['/api/timeline', id],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/timeline/user/${id}`);
      } catch (error) {
        // Return mock timeline
        return [
          {
            id: "1",
            title: "Launched New Product Line!",
            content: "Excited to announce our new sustainable product line. 🌱",
            likes: 45,
            comments: 12,
            shares: 5,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "2",
            title: "Celebrating 5 Years in Business",
            content: "What an incredible journey it has been! Thank you to all our customers and supporters.",
            mediaUrl: "/api/placeholder/400/400",
            likes: 123,
            comments: 34,
            shares: 15,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ];
      }
    },
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest('DELETE', `/api/entrepreneurs/${id}/follow`);
      } else {
        await apiRequest('POST', `/api/entrepreneurs/${id}/follow`);
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing
          ? `You've unfollowed ${profile?.displayName}`
          : `You're now following ${profile?.displayName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/entrepreneurs', id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'trophy': return <Trophy className="h-5 w-5" />;
      case 'users': return <User className="h-5 w-5" />;
      case 'dollar': return <TrendingUp className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8 border-2 hover:border-purple-400 transition-all">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {profile?.displayName?.charAt(0) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.verified && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-2">
                        {profile?.displayName}
                        {profile?.verified && (
                          <Badge className="bg-blue-100 text-blue-700">
                            Verified
                          </Badge>
                        )}
                      </h1>
                      <p className="text-lg text-muted-foreground mt-1">{profile?.title}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {profile?.location}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          {profile?.experience} years experience
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Joined {profile && format(new Date(profile.createdAt), 'MMM yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isOwnProfile ? (
                        <>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button variant="outline">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => followMutation.mutate()}
                            variant={isFollowing ? "outline" : "default"}
                          >
                            {isFollowing ? (
                              <>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Unfollow
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow
                              </>
                            )}
                          </Button>
                          <Button variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                    {profile?.bio}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile?.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-4 mt-4">
                    {profile?.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {profile?.socialLinks?.linkedin && (
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {profile?.socialLinks?.twitter && (
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Twitter className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {profile?.socialLinks?.instagram && (
                      <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Instagram className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {profile?.socialLinks?.facebook && (
                      <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Facebook className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8 pt-8 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.stats.totalBusinesses}</p>
                  <p className="text-sm text-muted-foreground">Businesses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.stats.totalFollowers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">${(profile?.stats.totalRevenue / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.stats.successRate}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile?.stats.spotlightWins}</p>
                  <p className="text-sm text-muted-foreground">Spotlight Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold flex items-center justify-center gap-1">
                    {profile?.stats.avgRating}
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="businesses">Businesses</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Rocket className="h-4 w-4 mr-2" />
                      View Timeline Posts
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="h-4 w-4 mr-2" />
                      Browse Businesses
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Trophy className="h-4 w-4 mr-2" />
                      View Achievements
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <Rocket className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Posted a new timeline update</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Trophy className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Won monthly spotlight</p>
                          <p className="text-xs text-muted-foreground">3 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Launched new business</p>
                          <p className="text-xs text-muted-foreground">1 week ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Businesses Tab */}
            <TabsContent value="businesses">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <Card key={business.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={business.logoUrl || undefined} />
                          <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Badge variant="secondary">{business.category}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{business.name}</CardTitle>
                      <CardDescription>{business.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {business.rating || 0}
                        </span>
                        <span className="text-muted-foreground">
                          {business.reviewCount || 0} reviews
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setLocation(`/business/${business.id}`)}
                      >
                        View Business
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {isOwnProfile && (
                  <Card className="border-dashed border-2 hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[250px]">
                      <Button variant="outline" onClick={() => setLocation('/create-business')}>
                        <Building2 className="h-5 w-5 mr-2" />
                        Add New Business
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <div className="space-y-6">
                {timeline.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
                            <AvatarFallback>{profile?.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile?.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(post.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold mb-2">{post.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                      {post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          className="mt-4 rounded-lg w-full"
                        />
                      )}
                      <div className="flex items-center gap-6 mt-4">
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                          <MessageSquare className="h-4 w-4" />
                          {post.comments}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                          <Share2 className="h-4 w-4" />
                          {post.shares}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {isOwnProfile && (
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Button onClick={() => setLocation('/timeline/create')}>
                        <Rocket className="h-5 w-5 mr-2" />
                        Create Timeline Post
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profile?.achievements.map((achievement) => (
                  <Card key={achievement.id} className={cn(
                    "hover:shadow-lg transition-all",
                    achievement.rarity === 'legendary' && "border-yellow-400",
                    achievement.rarity === 'epic' && "border-purple-400",
                    achievement.rarity === 'rare' && "border-blue-400"
                  )}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={cn("p-3 rounded-lg", getRarityColor(achievement.rarity))}>
                          {getAchievementIcon(achievement.icon)}
                        </div>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{achievement.title}</CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Earned {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  );
}
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertBusinessSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import GlowHero from "@/components/ui/glow-hero";
import { StardustButton } from "@/components/ui/stardust-button";
import { HolographicCard } from "@/components/ui/holographic-card";
import YouTubeBackground from '@/components/youtube-background';
import { ArrowLeft, Store, MapPin, Phone, Globe, Clock, Users, TrendingUp, Star, ArrowRight } from "lucide-react";

// Create business form schema with validation
const createBusinessSchema = insertBusinessSchema.omit({ ownerId: true });

type CreateBusinessForm = z.infer<typeof createBusinessSchema>;

const businessCategories = [
  "Food & Beverage",
  "Retail & Shopping",
  "Health & Beauty",
  "Professional Services",
  "Technology",
  "Arts & Entertainment",
  "Home & Garden",
  "Automotive",
  "Finance & Insurance",
  "Real Estate",
  "Education",
  "Sports & Recreation",
  "Travel & Tourism",
  "Non-profit",
  "Other"
];

export default function CreateBusiness() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CreateBusinessForm>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      category: "",
      location: "",
      address: "",
      phone: "",
      website: "",
      logoUrl: "",
      coverImageUrl: "",
      isActive: true,
    },
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: CreateBusinessForm) => {
      console.log('[CreateBusiness] Submitting business data:', {
        name: data.name,
        category: data.category,
        hasLogo: !!data.logoUrl,
        hasCoverImage: !!data.coverImageUrl
      });

      const response = await apiRequest('POST', '/api/businesses', data);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CreateBusiness] Failed to create business:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to create business');
      }

      return await response.json();
    },
    onSuccess: (business) => {
      console.log('[CreateBusiness] Business created successfully:', business.id);
      toast({
        title: "Business created successfully!",
        description: "Your business profile has been created and is now live.",
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/search'] });

      // Redirect to business profile
      setLocation(`/business/${business.id}`);
    },
    onError: (error: any) => {
      console.error('[CreateBusiness] Error creating business:', error);
      toast({
        title: "Failed to create business",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateBusinessForm) => {
    console.log('[CreateBusiness] Form submitted with data:', data);

    // Clean up empty strings
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = value === "" ? undefined : value;
      return acc;
    }, {} as any);

    console.log('[CreateBusiness] Cleaned data:', cleanData);
    createBusinessMutation.mutate(cleanData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <YouTubeBackground youtubeUrl="https://youtu.be/I0qV37ezBJc" overlayOpacity={0.4} />

        <div className="relative z-10 container mx-auto px-4 py-16 text-center min-h-screen flex items-center justify-center">
          <div className="max-w-md">
            <Store className="mx-auto h-16 w-16 text-white mb-6" />
            <h1 className="text-3xl font-bold mb-4 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Sign In Required</h1>
            <p className="text-white mb-8" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
              You need to sign in to create a business profile.
            </p>
            <Button
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-signin-create-business"
              className="bg-gradient-to-r from-[#d4af37] to-[#ffd700] hover:from-[#c5a028] hover:to-[#e8c800] text-white shadow-lg"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Video Background */}
      <YouTubeBackground youtubeUrl="https://youtu.be/I0qV37ezBJc" overlayOpacity={0.3} />

      <div className="relative z-10">
        {/* FLORIDA LOCAL HERO SECTION */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 glass-section-overlay"></div>

          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            {/* Florida Local Branded Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-[#008B8B] via-[#d4af37] to-[#008B8B] bg-clip-text text-transparent">
              Ready to Grow Your Business?
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed mb-12" style={{textShadow: '0 2px 6px rgba(0,0,0,0.9)'}}>
              Join Florida's premier business community. Connect with customers, showcase your products,
              and grow your local presence with our comprehensive platform.
            </p>

            {/* Florida Local Branded Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <StardustButton
                variant="gold"
                size="lg"
                onClick={() => {
                  const element = document.getElementById('business-form');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-testid="button-get-started-create-business"
              >
                <Store className="h-5 w-5 mr-2" />
                Get Started - Create Your Business
              </StardustButton>
              <StardustButton
                variant="teal"
                size="lg"
                onClick={() => setLocation('/marketplace')}
                data-testid="button-explore-marketplace"
              >
                Explore Marketplace
                <ArrowRight className="h-4 w-4 ml-2" />
              </StardustButton>
            </div>

            {/* FLORIDA LOCAL BENEFITS CARDS - Teal-Gold-Bronze Theme */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <HolographicCard className="holo-teal" intensity="medium">
                <div className="holo-content p-8 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-teal mb-6 shine-sweep-hover">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
                    Connect with Customers
                  </h3>
                  <p className="text-sm text-white leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                    Build relationships and grow your customer base in Florida's local community
                  </p>
                </div>
              </HolographicCard>

              <HolographicCard className="holo-gold" intensity="medium">
                <div className="holo-content p-8 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-gold mb-6 shine-sweep-hover">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
                    Boost Your Sales
                  </h3>
                  <p className="text-sm text-white leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                    Showcase products, run promotions, and drive more revenue through our marketplace
                  </p>
                </div>
              </HolographicCard>

              <HolographicCard className="holo-bronze" intensity="medium">
                <div className="holo-content p-8 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-bronze mb-6 shine-sweep-hover">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
                    Build Your Brand
                  </h3>
                  <p className="text-sm text-white leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                    Create a professional presence and get featured in our business spotlight
                  </p>
                </div>
              </HolographicCard>
            </div>
          </div>
        </section>

        {/* FORM SECTION */}
        <section id="business-form" className="relative py-16">
          <div className="absolute inset-0 glass-tint-light"></div>

          <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/')}
                data-testid="button-back-home"
                className="bg-white/90 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h2 className="text-3xl font-bold text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.4)'}}>Create Your Business</h2>
                <p className="text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>Join Florida's thriving business community</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Business Basics */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-2 border-white/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <Store className="h-5 w-5" />
                      <span>Business Basics</span>
                    </CardTitle>
                    <CardDescription>
                      Essential information about your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your business name"
                              {...field}
                              data-testid="input-business-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tagline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagline</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="A short, catchy description of your business"
                              {...field}
                              value={field.value ?? ''}
                              data-testid="input-business-tagline"
                            />
                          </FormControl>
                          <FormDescription>
                            Optional tagline that appears under your business name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell people about your business, what makes you special, your story..."
                              className="min-h-[120px]"
                              {...field}
                              value={field.value ?? ''}
                              data-testid="textarea-business-description"
                            />
                          </FormControl>
                          <FormDescription>
                            This will appear on your business profile page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-business-category">
                                <SelectValue placeholder="Select your business category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps customers find your business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Location & Contact */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-2 border-white/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <MapPin className="h-5 w-5" />
                      <span>Location & Contact</span>
                    </CardTitle>
                    <CardDescription>
                      Help customers find and contact you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City/Area</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Miami, FL"
                                {...field}
                                value={field.value ?? ''}
                                data-testid="input-business-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(555) 123-4567"
                                type="tel"
                                {...field}
                                value={field.value ?? ''}
                                data-testid="input-business-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main Street, Miami, FL 33101"
                              {...field}
                              value={field.value ?? ''}
                              data-testid="input-business-address"
                            />
                          </FormControl>
                          <FormDescription>
                            Full address for customer visits and deliveries
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://www.yourbusiness.com"
                              type="url"
                              {...field}
                              value={field.value ?? ''}
                              data-testid="input-business-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Visual Identity */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-2 border-white/50">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Visual Identity</CardTitle>
                    <CardDescription>
                      Make your business stand out with great visuals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              label="Business Logo"
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                              placeholder="Upload your logo"
                              aspectRatio="square"
                              maxSizeMB={2}
                            />
                            <FormDescription>
                              Square image works best. Will be displayed at various sizes.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coverImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              label="Cover Image"
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                              placeholder="Upload cover image"
                              aspectRatio="landscape"
                              maxSizeMB={5}
                            />
                            <FormDescription>
                              Wide image for your business profile header.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Section */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-2 border-white/50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Ready to launch your business?</h3>
                          <p className="text-sm text-gray-600">
                            You can always edit this information later from your business profile.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-end space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation('/')}
                          data-testid="button-cancel-create-business"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createBusinessMutation.isPending}
                          data-testid="button-submit-create-business"
                          className="bg-gradient-to-r from-[#d4af37] to-[#ffd700] hover:from-[#c5a028] hover:to-[#e8c800] text-white shadow-lg"
                        >
                          {createBusinessMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Creating Business...
                            </>
                          ) : (
                            <>
                              <Store className="h-4 w-4 mr-2" />
                              Create Business
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        </section>
      </div>
    </div>
  );
}

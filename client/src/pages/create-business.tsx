import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertBusinessSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ImageUpload from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Store, MapPin, Phone, Globe, Clock } from "lucide-react";

// Create business form schema with validation
const createBusinessSchema = insertBusinessSchema.omit({ ownerId: true }).extend({
  name: z.string().min(1, "Business name is required").max(255, "Business name must be less than 255 characters"),
  tagline: z.string().max(500, "Tagline must be less than 500 characters").optional(),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
});

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
      const response = await apiRequest('POST', '/api/businesses', data);
      return await response.json();
    },
    onSuccess: (business) => {
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
      toast({
        title: "Failed to create business",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateBusinessForm) => {
    // Clean up empty strings
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = value === "" ? undefined : value;
      return acc;
    }, {} as any);

    createBusinessMutation.mutate(cleanData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">
            You need to sign in to create a business profile.
          </p>
          <Button onClick={() => setLocation('/api/login')} data-testid="button-signin-create-business">
            Sign In to Continue
          </Button>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Create Your Business</h1>
            <p className="text-muted-foreground">Join Florida's thriving business community</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Business Basics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
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
            <Card>
              <CardHeader>
                <CardTitle>Visual Identity</CardTitle>
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Ready to launch your business?</h3>
                      <p className="text-sm text-muted-foreground">
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

      <MobileBottomNav />
    </div>
  );
}
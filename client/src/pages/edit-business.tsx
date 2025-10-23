import React from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { updateBusinessSchema, type Business } from "@shared/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Store, MapPin, Save, AlertTriangle, Trash2 } from "lucide-react";

// Edit business form schema
const editBusinessSchema = updateBusinessSchema.extend({
  name: z.string().min(1, "Business name is required").max(255, "Business name must be less than 255 characters"),
  tagline: z.string().max(500, "Tagline must be less than 500 characters").optional(),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
});

type EditBusinessForm = z.infer<typeof editBusinessSchema>;

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

export default function EditBusiness() {
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch business data
  const { data: business, isLoading, error } = useQuery<Business>({
    queryKey: ['/api/businesses', id],
    enabled: !!id,
  });

  const form = useForm<EditBusinessForm>({
    resolver: zodResolver(editBusinessSchema),
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

  // Reset form when business data loads
  React.useEffect(() => {
    if (business) {
      form.reset({
        name: business.name || "",
        tagline: business.tagline || "",
        description: business.description || "",
        category: business.category || "",
        location: business.location || "",
        address: business.address || "",
        phone: business.phone || "",
        website: business.website || "",
        logoUrl: business.logoUrl || "",
        coverImageUrl: business.coverImageUrl || "",
        isActive: business.isActive ?? true,
      });
    }
  }, [business, form]);

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: EditBusinessForm) => {
      const response = await apiRequest('PUT', `/api/businesses/${id}`, data);
      return await response.json();
    },
    onSuccess: (updatedBusiness) => {
      toast({
        title: "Business updated successfully!",
        description: "Your changes have been saved.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/search'] });
      
      // Redirect back to business profile
      setLocation(`/business/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update business",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/businesses/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Business deleted successfully!",
        description: "Your business has been permanently removed.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/search'] });
      
      // Redirect to home
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete business",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditBusinessForm) => {
    // Clean up empty strings
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = value === "" ? undefined : value;
      return acc;
    }, {} as any);

    updateBusinessMutation.mutate(cleanData);
  };

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">
            You need to sign in to edit a business profile.
          </p>
          <Button onClick={() => window.location.href = '/api/login'} data-testid="button-signin-edit-business">
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-16" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or business not found
  if (error || !business) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The business you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation('/')} data-testid="button-back-home-error">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Authorization check - only business owner can edit
  if (business.ownerId !== user?.id) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You can only edit businesses that you own.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation(`/business/${id}`)}
              data-testid="button-view-business"
            >
              View Business
            </Button>
            <Button onClick={() => setLocation('/')} data-testid="button-back-home-unauthorized">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="edit-business-header flex items-center space-x-4 mb-8 rounded-2xl p-6">
          <div className="marble-content flex items-center space-x-4 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/business/${id}`)}
              data-testid="button-back-business-profile"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Edit Business</h1>
              <p className="text-muted-foreground">Update your business information</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Business Basics */}
            <Card className="edit-business-basics-card">
              <CardHeader className="marble-content">
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5" />
                  <span>Business Basics</span>
                </CardTitle>
                <CardDescription>
                  Essential information about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content space-y-6">
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
                          data-testid="input-edit-business-name"
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
                          data-testid="input-edit-business-tagline"
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
                          data-testid="textarea-edit-business-description"
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-business-category">
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
            <Card className="edit-business-location-card">
              <CardHeader className="marble-content">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Location & Contact</span>
                </CardTitle>
                <CardDescription>
                  Help customers find and contact you
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content space-y-6">
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
                            data-testid="input-edit-business-location"
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
                            data-testid="input-edit-business-phone"
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
                          data-testid="input-edit-business-address"
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
                          data-testid="input-edit-business-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Visual Identity */}
            <Card className="edit-business-visual-card">
              <CardHeader className="marble-content">
                <CardTitle>Visual Identity</CardTitle>
                <CardDescription>
                  Update your business visuals
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content space-y-6">
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
            <Card className="edit-business-submit-card">
              <CardContent className="marble-content pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Save your changes</h3>
                      <p className="text-sm text-muted-foreground">
                        Your updated information will be visible to customers immediately.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={deleteBusinessMutation.isPending}
                          data-testid="button-delete-business"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Business
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Business</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this business? This action cannot be undone and will permanently remove all business data including products, posts, and analytics.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBusinessMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            {deleteBusinessMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              "Delete Business"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Save/Cancel Buttons */}
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation(`/business/${id}`)}
                        data-testid="button-cancel-edit-business"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateBusinessMutation.isPending || deleteBusinessMutation.isPending}
                        data-testid="button-save-business-changes"
                      >
                        {updateBusinessMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}

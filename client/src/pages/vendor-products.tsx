import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { X } from "lucide-react";

type Product = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  price: string;
  originalPrice: string | null;
  category: string | null;
  images: string[] | null;
  inventory: number | null;
  isActive: boolean | null;
  isDigital: boolean | null;
  tags: string[] | null;
  rating: string | null;
  reviewCount: number | null;
  createdAt: string;
  updatedAt: string;
};

type Business = {
  id: string;
  name: string;
  ownerId: string;
};

export default function VendorProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Get user's businesses
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/businesses/my"],
    enabled: isAuthenticated,
  });

  // Get products for selected business
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/businesses", selectedBusiness, "products"],
    enabled: !!selectedBusiness,
  });

  const createProduct = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      toast({ title: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", selectedBusiness, "products"] });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return await apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", selectedBusiness, "products"] });
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      businessId: selectedBusiness,
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      originalPrice: formData.get("originalPrice") || null,
      category: formData.get("category"),
      inventory: parseInt(formData.get("inventory") as string) || 0,
      isActive: formData.get("isActive") === "true",
      isDigital: formData.get("isDigital") === "true",
      tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map(t => t.trim()) : [],
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data });
    } else {
      createProduct.mutate(data);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">Please sign in to manage products.</div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Vendor Products</h1>
          <div className="text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
            You need to create a business first. <a href="/create-business" className="text-white underline hover:no-underline">Create Business</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
      <div className="vendor-products-header flex items-center justify-between mb-6 rounded-2xl p-6 relative">
        <h1 className="text-3xl font-bold marble-content" data-testid="heading-vendor-products">Vendor Products</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button disabled={!selectedBusiness} className="marble-content" data-testid="button-add-product">Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl vendor-product-dialog">
            <div className="marble-content">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
              </DialogHeader>
              <ProductForm 
                product={editingProduct} 
                onSubmit={handleSubmit}
                isLoading={createProduct.isPending || updateProduct.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Business Selection */}
      <div className="vendor-business-selection mb-6 rounded-2xl p-6 relative">
        <div className="marble-content">
          <Label htmlFor="business-select">Select Business</Label>
          <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
            <SelectTrigger className="w-full max-w-md" id="business-select" data-testid="select-business">
              <SelectValue placeholder="Choose a business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {selectedBusiness && (
        <div className="vendor-products-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative rounded-2xl p-6">
          <div className="marble-content col-span-full grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div data-testid="loading-products">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="col-span-full text-muted-foreground" data-testid="empty-products">No products yet. Create your first product!</div>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="vendor-product-card hover:shadow-lg transition-shadow relative bg-white/80 backdrop-blur-md" data-testid={`card-product-${product.id}`}>
                  <CardHeader className="marble-content">
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate" data-testid={`text-product-name-${product.id}`}>{product.name}</span>
                      <Badge variant={product.isActive ? "default" : "secondary"} data-testid={`badge-product-status-${product.id}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="marble-content">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" data-testid={`text-product-price-${product.id}`}>${parseFloat(product.price).toFixed(2)}</span>
                        {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                          <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                            ${parseFloat(product.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-product-stock-${product.id}`}>
                        Stock: {product.inventory ?? "Unlimited"}
                      </div>
                      {product.category && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-product-category-${product.id}`}>{product.category}</Badge>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowCreateDialog(true);
                          }}
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct && showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
          setShowCreateDialog(false);
        }
      }}>
        <DialogContent className="max-w-2xl vendor-product-dialog">
          <div className="marble-content">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <ProductForm 
              product={editingProduct} 
              onSubmit={handleSubmit}
              isLoading={updateProduct.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function ProductForm({ 
  product, 
  onSubmit, 
  isLoading 
}: { 
  product: Product | null; 
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publicPathMap, setPublicPathMap] = useState<Map<string, string>>(new Map());

  const saveImage = useMutation({
    mutationFn: async ({ productId, imageUrl }: { productId: string; imageUrl: string }) => {
      return await apiRequest("POST", `/api/products/${productId}/images`, { imageUrl });
    },
    onSuccess: () => {
      toast({ title: "Image uploaded successfully" });
      if (product?.businessId) {
        queryClient.invalidateQueries({ queryKey: ["/api/businesses", product.businessId, "products"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/businesses/my"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save image", description: error.message, variant: "destructive" });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async ({ productId, imageUrl }: { productId: string; imageUrl: string }) => {
      return await apiRequest("DELETE", `/api/products/${productId}/images`, { imageUrl });
    },
    onSuccess: () => {
      toast({ title: "Image deleted successfully" });
      if (product?.businessId) {
        queryClient.invalidateQueries({ queryKey: ["/api/businesses", product.businessId, "products"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/businesses/my"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete image", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = async (file: any): Promise<{ method: "PUT"; url: string }> => {
    if (!product?.id) return { method: "PUT" as const, url: "" };

    setUploadingImage(true);

    try {
      const response: any = await apiRequest("POST", `/api/products/${product.id}/images/upload-url`, {
        filename: file.name,
      });

      setPublicPathMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(file.id, response.publicPath);
        return newMap;
      });

      return {
        method: "PUT",
        url: response.url,
      };
    } catch (error: any) {
      toast({ 
        title: "Failed to get upload URL", 
        description: error.message, 
        variant: "destructive" 
      });
      setUploadingImage(false);
      throw error;
    }
  };

  const handleUploadComplete = async (result: any) => {
    if (!product?.id) return;

    setUploadingImage(false);
    
    const uploadedFiles = result.successful || [];
    
    try {
      for (const file of uploadedFiles) {
        const publicPath = publicPathMap.get(file.id);
        
        if (publicPath) {
          await saveImage.mutateAsync({ productId: product.id, imageUrl: publicPath });
        } else {
          toast({ 
            title: "Failed to save image", 
            description: "Could not retrieve image path", 
            variant: "destructive" 
          });
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Error saving images", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setPublicPathMap(new Map());
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input 
          id="name" 
          name="name" 
          defaultValue={product?.name || ""} 
          required 
          data-testid="input-product-name"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={product?.description || ""} 
          rows={3}
          data-testid="textarea-product-description"
        />
      </div>

      {/* Product Images Section - Only show for existing products */}
      {product?.id && (
        <div className="space-y-3">
          <Label>Product Images ({product.images?.length || 0}/5)</Label>
          
          {/* Current Images */}
          {product.images && product.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((imageUrl, index) => (
                <div key={index} className="relative group" data-testid={`image-thumbnail-${index}`}>
                  <img 
                    src={imageUrl} 
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteImage.mutate({ productId: product.id, imageUrl })}
                    disabled={deleteImage.isPending}
                    data-testid={`button-delete-image-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {(!product.images || product.images.length < 5) && (
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              onGetUploadParameters={handleImageUpload}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              {uploadingImage ? "Uploading..." : "Upload Product Image"}
            </ObjectUploader>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input 
            id="price" 
            name="price" 
            type="number" 
            step="0.01" 
            min="0"
            defaultValue={product?.price || ""} 
            required 
          />
        </div>
        <div>
          <Label htmlFor="originalPrice">Original Price</Label>
          <Input 
            id="originalPrice" 
            name="originalPrice" 
            type="number" 
            step="0.01" 
            min="0"
            defaultValue={product?.originalPrice || ""} 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={product?.category || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
              <SelectItem value="Fashion">Fashion</SelectItem>
              <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
              <SelectItem value="Home & Garden">Home & Garden</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Art & Crafts">Art & Crafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="inventory">Inventory</Label>
          <Input 
            id="inventory" 
            name="inventory" 
            type="number" 
            min="0"
            defaultValue={product?.inventory?.toString() || "0"} 
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input 
          id="tags" 
          name="tags" 
          defaultValue={product?.tags?.join(", ") || ""} 
          placeholder="local-made, eco-friendly, handcrafted"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="isActive" 
            name="isActive" 
            value="true"
            defaultChecked={product?.isActive !== false} 
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="isDigital" 
            name="isDigital" 
            value="true"
            defaultChecked={product?.isDigital || false} 
          />
          <Label htmlFor="isDigital">Digital Product</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

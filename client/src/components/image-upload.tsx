import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImageUploadProps {
  label: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  placeholder?: string;
  aspectRatio?: "square" | "landscape";
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  placeholder,
  aspectRatio = "square",
  accept = "image/*",
  maxSizeMB = 5
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Client-side validation (also validated on server)
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select an image under ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate specific image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Unsupported image type",
        description: "Please use JPEG, PNG, GIF, or WebP images",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('[ImageUpload] Step 1: Requesting upload URL...', {
        fileType: file.type,
        fileSize: file.size,
        fileName: file.name
      });

      // Step 1: Get upload URL from backend with file validation
      const uploadResponse = await apiRequest('POST', '/api/objects/upload', {
        fileType: file.type,
        fileSize: file.size,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('[ImageUpload] Failed to get upload URL:', error);
        throw new Error(error.message || 'Failed to get upload URL');
      }

      const { uploadURL } = await uploadResponse.json();
      console.log('[ImageUpload] Step 2: Received upload URL, uploading file...');

      // Step 2: Upload file directly to object storage
      const uploadResult = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text();
        console.error('[ImageUpload] Failed to upload to storage:', {
          status: uploadResult.status,
          statusText: uploadResult.statusText,
          error: errorText
        });
        throw new Error(`Failed to upload file to storage: ${uploadResult.status} ${uploadResult.statusText}`);
      }

      console.log('[ImageUpload] Step 3: File uploaded, setting ACL policy...');

      // Step 3: Set ACL policy and get public URL
      const aclResponse = await apiRequest('PUT', '/api/business-images', {
        imageURL: uploadURL,
      });

      if (!aclResponse.ok) {
        const error = await aclResponse.json();
        console.error('[ImageUpload] Failed to set ACL policy:', error);
        throw new Error(error.error || error.message || 'Failed to process uploaded image');
      }

      const { publicURL } = await aclResponse.json();
      console.log('[ImageUpload] Step 4: Success! Public URL received:', publicURL);

      // Step 4: Update component with the public URL
      onChange(publicURL);

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error: any) {
      console.error('[ImageUpload] Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    if (value && value.startsWith('blob:')) {
      // Revoke local blob URL to prevent memory leaks
      URL.revokeObjectURL(value);
    }
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectRatioClass = aspectRatio === "landscape" ? "aspect-[16/9]" : "aspect-square";

  return (
    <div className="space-y-2">
      <Label htmlFor={`upload-${label}`}>{label}</Label>
      
      {value ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative group">
            <div className={`${aspectRatioClass} relative`}>
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', value);
                  // Optionally set a fallback image or show error state
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-change-image"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    data-testid="button-remove-image"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-testid="image-upload-dropzone"
        >
          <CardContent className={`${aspectRatioClass} flex flex-col items-center justify-center text-center p-6`}>
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {placeholder || `Upload ${label}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF (Max {maxSizeMB}MB)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Input
        ref={fileInputRef}
        id={`upload-${label}`}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  );
}
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload: (file: File) => Promise<void>;
  userName?: string;
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  onUpload,
  userName = "User",
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File must be an image");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setIsUploading(true);
      try {
        await onUpload(file);
        toast.success("Avatar updated successfully");
      } catch (error) {
        toast.error("Failed to upload avatar");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRemovePreview = () => {
    setPreview(null);
  };

  const displayAvatar = preview || currentAvatar;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Avatar Preview */}
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          {displayAvatar ? (
            <AvatarImage src={displayAvatar} alt={userName} />
          ) : (
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            PNG, JPG or GIF. Max 5MB.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isDragActive ? (
            <>
              <Upload className="h-8 w-8 text-blue-500" />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Drop your image here
              </p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-neutral-400" />
              <p className="text-sm font-medium">
                {isUploading
                  ? "Uploading..."
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                SVG, PNG, JPG or GIF (max. 5MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {preview && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemovePreview}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

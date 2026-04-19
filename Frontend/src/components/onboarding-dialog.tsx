import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateChurch } from "@/hooks/use-churches";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Building2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers and hyphens only",
    ),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const DISMISS_KEY = "onboarding_dismissed";

export function OnboardingDialog() {
  const { userChurches, isAuthenticated, isLoading, setActiveChurch } =
    useAuthStore();
  const createChurch = useCreateChurch();
  const [dismissed, setDismissed] = useState(
    () => !!sessionStorage.getItem(DISMISS_KEY),
  );
  const [open, setOpen] = useState(false);

  const hasChurch = userChurches.length > 0;

  useEffect(() => {
    // Wait for auth to finish loading before deciding
    if (isAuthenticated && !isLoading && !hasChurch && !dismissed) {
      // Small delay so layout renders first
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    } else {
      setOpen(false);
    }
  }, [isAuthenticated, isLoading, hasChurch, dismissed]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchName = watch("name");
  useEffect(() => {
    if (watchName) {
      setValue(
        "slug",
        watchName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      );
    }
  }, [watchName, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const church = await createChurch.mutateAsync(data);
      setActiveChurch(church.id);
      toast.success("Church created! Welcome to MultipliChurch.");
      reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create church");
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing by clicking outside or pressing Escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Welcome! Set up your church
          </DialogTitle>
          <DialogDescription>
            Create your church to start managing your community. You can always
            update these details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Church Name</Label>
            <Input
              placeholder="Grace Community Church"
              className="h-10"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Slug</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                /
              </span>
              <Input
                placeholder="grace-community-church"
                className="h-10 pl-6"
                {...register("slug")}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              placeholder="A brief description of your church"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("description")}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createChurch.isPending}
          >
            {createChurch.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              "Create Church"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleDismiss}
        >
          <LinkIcon className="h-4 w-4" />I have an invite link
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You can create your church later from the My Church page.
        </p>
      </DialogContent>
    </Dialog>
  );
}

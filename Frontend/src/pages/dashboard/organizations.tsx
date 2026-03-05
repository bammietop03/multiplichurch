import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useOrganizations,
  useCreateOrganization,
  useLeaveOrganization,
} from "@/hooks/use-organizations";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Building2,
  Plus,
  Users,
  LogOut,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import type { Organization } from "@/types";

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase, alphanumeric with hyphens"
    ),
  description: z.string().max(500).optional(),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const leaveOrg = useLeaveOrganization();
  const { activeOrganizationId, setActiveOrganization } = useAuthStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [leaveDialogOrg, setLeaveDialogOrg] = useState<Organization | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
  });

  const watchName = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug);
  };

  const onCreateSubmit = async (data: CreateOrgFormData) => {
    try {
      await createOrg.mutateAsync(data);
      setCreateDialogOpen(false);
      reset();
    } catch {
      // Error handled by mutation
    }
  };

  const handleLeave = async () => {
    if (!leaveDialogOrg) return;
    try {
      await leaveOrg.mutateAsync(leaveDialogOrg.id);
      if (activeOrganizationId === leaveDialogOrg.id) {
        setActiveOrganization(null);
      }
      setLeaveDialogOrg(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleSetActive = (orgId: string) => {
    setActiveOrganization(activeOrganizationId === orgId ? null : orgId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your teams and workspaces
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onCreateSubmit)}>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization to collaborate with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {createOrg.isError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {(createOrg.error as Error)?.message ||
                      "Failed to create organization"}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Organization name</Label>
                  <Input
                    id="name"
                    placeholder="My Organization"
                    {...register("name", { onChange: handleNameChange })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="my-organization"
                    {...register("slug")}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier for your organization
                  </p>
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="A brief description of your organization"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createOrg.isPending}>
                  {createOrg.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : organizations?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className={`relative ${
                activeOrganizationId === org.id ? "ring-2 ring-primary" : ""
              }`}
            >
              {activeOrganizationId === org.id && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription>/{org.slug}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {org.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={
                        activeOrganizationId === org.id ? "default" : "outline"
                      }
                      onClick={() => handleSetActive(org.id)}
                    >
                      {activeOrganizationId === org.id
                        ? "Active"
                        : "Set Active"}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setLeaveDialogOrg(org)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No organizations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first organization to start collaborating with your
              team
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leave Organization Dialog */}
      <Dialog
        open={!!leaveDialogOrg}
        onOpenChange={() => setLeaveDialogOrg(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave "{leaveDialogOrg?.name}"? You'll
              lose access to all resources in this organization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOrg(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={leaveOrg.isPending}
            >
              {leaveOrg.isPending ? <Spinner size="sm" /> : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

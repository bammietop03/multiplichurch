import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useChurches,
  useCreateChurch,
  useUpdateChurch,
  useUpdateChurchLogo,
  useLeaveChurch,
  useDeleteChurch,
  useChurchMembers,
} from "@/hooks/use-churches";
import { useUploadFile } from "@/hooks/use-files";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Building2,
  Plus,
  LogOut,
  Pencil,
  Trash2,
  Users,
  Calendar,
  Camera,
  Hash,
  Crown,
} from "lucide-react";
import type { Church } from "@/types";
import { toast } from "sonner";

const createChurchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase, alphanumeric with hyphens only",
    ),
  description: z.string().max(500).optional(),
});

const editChurchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

type CreateChurchFormData = z.infer<typeof createChurchSchema>;
type EditChurchFormData = z.infer<typeof editChurchSchema>;

function ChurchDetail({ church }: { church: Church }) {
  const { isChurchAdmin, userChurches } = useAuthStore();
  const updateChurch = useUpdateChurch(church.id);
  const updateChurchLogo = useUpdateChurchLogo(church.id);
  const leaveChurch = useLeaveChurch();
  const deleteChurch = useDeleteChurch();
  const uploadFile = useUploadFile();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const isAdmin = isChurchAdmin(church.id);
  const myRole = userChurches.find((c) => c.id === church.id)?.role ?? "MEMBER";

  const { data: membersData } = useChurchMembers(church.id);
  const totalMembers = membersData?.meta?.total ?? 0;
  const adminCount =
    membersData?.data?.filter((m) => m.role === "ADMIN").length ?? 0;
  const memberCount = totalMembers - adminCount;

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditChurchFormData>({
    resolver: zodResolver(editChurchSchema),
    defaultValues: { name: church.name, description: church.description ?? "" },
  });

  useEffect(() => {
    resetEdit({ name: church.name, description: church.description ?? "" });
  }, [church, resetEdit]);

  const onEditSubmit = async (data: EditChurchFormData) => {
    try {
      await updateChurch.mutateAsync(data);
      toast.success("Church updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update church");
    }
  };

  const handleLogoClick = () => {
    if (isAdmin) logoInputRef.current?.click();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    try {
      const uploaded = await uploadFile.mutateAsync(file);
      const url =
        uploaded?.url ??
        (uploaded as unknown as { data: { url: string } })?.data?.url;
      if (url) {
        await updateChurchLogo.mutateAsync(url);
        toast.success("Logo updated");
      }
    } catch {
      toast.error("Failed to upload logo");
      setLogoPreview(null);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveChurch.mutateAsync(church.id);
      toast.success("Left church");
      setLeaveOpen(false);
    } catch {
      toast.error("Failed to leave church");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteChurch.mutateAsync(church.id);
      toast.success("Church deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete church");
    }
  };

  const logoSrc = logoPreview ?? church.logo;

  return (
    <div className="space-y-6">
      {/* Church header */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        {/* Top banner */}
        <div className="h-24 bg-linear-to-r from-primary/80 to-primary" />

        <div className="px-6 pb-6">
          {/* Logo + actions */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              <button
                onClick={handleLogoClick}
                className="relative group h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden"
                disabled={!isAdmin}
                type="button"
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={church.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              {(uploadFile.isPending || updateChurch.isPending) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pb-1">
              {isAdmin && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Church</DialogTitle>
                      <DialogDescription>
                        Update your church details.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleEditSubmit(onEditSubmit)}
                      className="space-y-4 py-2"
                    >
                      <div className="space-y-1.5">
                        <Label>Church Name</Label>
                        <Input {...registerEdit("name")} className="h-10" />
                        {editErrors.name && (
                          <p className="text-sm text-destructive">
                            {editErrors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description (optional)</Label>
                        <textarea
                          {...registerEdit("description")}
                          rows={3}
                          placeholder="A short description of your church"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateChurch.isPending}>
                          {updateChurch.isPending ? (
                            <>
                              <Spinner size="sm" className="mr-2" />
                              Saving...
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {!isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Leave
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Church name + meta */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold">{church.name}</h2>
              <Badge variant={myRole === "ADMIN" ? "default" : "secondary"}>
                {myRole === "ADMIN" ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </>
                ) : (
                  "Member"
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              <span>{church.slug}</span>
            </div>
            {church.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {church.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "Total Members",
            value: totalMembers,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: Crown,
            label: "Admins",
            value: adminCount,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: Users,
            label: "Members",
            value: memberCount,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            icon: Calendar,
            label: "Created",
            value: new Date(church.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-white p-4 flex items-center gap-3"
          >
            <div
              className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-semibold text-sm">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave Church"
        description={`Are you sure you want to leave "${church.name}"?`}
        confirmLabel="Leave"
        variant="destructive"
        onConfirm={handleLeave}
        isLoading={leaveChurch.isPending}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Church"
        description={`This will permanently delete "${church.name}" and remove all members. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteChurch.isPending}
      />
    </div>
  );
}

export default function ChurchesPage() {
  const { data: churches, isLoading } = useChurches();
  const createChurch = useCreateChurch();
  const { setActiveChurch } = useAuthStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateChurchFormData>({
    resolver: zodResolver(createChurchSchema),
  });

  const watchName = watch("name");

  useEffect(() => {
    if (watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setValue("slug", slug);
    }
  }, [watchName, setValue]);

  const onSubmit = async (data: CreateChurchFormData) => {
    try {
      const newChurch = await createChurch.mutateAsync(data);
      setActiveChurch(newChurch.id);
      toast.success("Church created successfully");
      setCreateDialogOpen(false);
      reset();
    } catch {
      toast.error("Failed to create church");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Church</h1>
          <p className="text-muted-foreground">
            View and manage your church details.
          </p>
        </div>
        {!churches?.length && !isLoading && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Church
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Church</DialogTitle>
                <DialogDescription>
                  Set up your church to start managing your community.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 py-2"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="church-name">Church Name</Label>
                  <Input
                    id="church-name"
                    placeholder="Grace Community Church"
                    className="h-10"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="church-slug">Slug</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      /
                    </span>
                    <Input
                      id="church-slug"
                      placeholder="grace-community-church"
                      className="h-10 pl-6"
                      {...register("slug")}
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="church-desc">Description (optional)</Label>
                  <textarea
                    id="church-desc"
                    placeholder="A brief description of your church"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    {...register("description")}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createChurch.isPending}>
                    {createChurch.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Creating...
                      </>
                    ) : (
                      "Create Church"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !churches?.length ? (
        <EmptyState
          icon={Building2}
          title="No church yet"
          description="Create your church to start managing your community."
          action={{
            label: "Create Church",
            onClick: () => setCreateDialogOpen(true),
          }}
        />
      ) : (
        churches.map((church: Church) => (
          <ChurchDetail key={church.id} church={church} />
        ))
      )}
    </div>
  );
}

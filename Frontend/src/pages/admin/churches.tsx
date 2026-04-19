import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminChurches,
  useAdminCreateChurch,
  useAdminInviteMember,
  useAdminDeleteChurch,
  useAdminChurchMembers,
} from "@/hooks/use-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Building2,
  Plus,
  Search,
  Users,
  Trash2,
  UserPlus,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Mail,
} from "lucide-react";
import type { Church } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const createChurchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase, numbers and hyphens only"),
  description: z.string().max(500).optional(),
});

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type CreateChurchForm = z.infer<typeof createChurchSchema>;
type InviteForm = z.infer<typeof inviteSchema>;

function ChurchDetailSheet({
  church,
  open,
  onOpenChange,
  onInvite,
}: {
  church: (Church & { _count: { members: number } }) | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvite: () => void;
}) {
  const { data: members = [], isLoading } = useAdminChurchMembers(
    church?.id ?? "",
  );

  const getInitials = (m: {
    firstName?: string;
    lastName?: string;
    email: string;
  }) =>
    m.firstName && m.lastName
      ? `${m.firstName[0]}${m.lastName[0]}`.toUpperCase()
      : m.email[0].toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {church && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                {church.logo ? (
                  <img
                    src={church.logo}
                    alt={church.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <SheetTitle>{church.name}</SheetTitle>
                  <SheetDescription className="font-mono text-xs">
                    /{church.slug}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={church.isActive ? "default" : "secondary"}>
                  {church.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Members</p>
                <p className="font-semibold">{church._count.members}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(church.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              {church.description && (
                <div className="rounded-lg bg-muted/50 p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{church.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Members</h3>
              <Button size="sm" variant="outline" onClick={onInvite}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Invite
              </Button>
            </div>
            <Separator className="mb-4" />

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.user.avatar ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(m.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.user.firstName
                          ? `${m.user.firstName} ${m.user.lastName ?? ""}`.trim()
                          : m.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 inline" />
                        {m.user.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant={m.role === "ADMIN" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {m.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(m.joinedAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function AdminChurchesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<
    (Church & { _count: { members: number } }) | null
  >(null);
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const { data: churches = [], isLoading } = useAdminChurches(debouncedSearch);
  const createChurch = useAdminCreateChurch();
  const deleteChurch = useAdminDeleteChurch();
  const inviteMember = useAdminInviteMember(selectedChurch?.id ?? "");

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(
      () => setDebouncedSearch(val),
      350,
    );
  };

  const {
    register: regCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
    setValue: setValueCreate,
    formState: { errors: createErrors },
  } = useForm<CreateChurchForm>({ resolver: zodResolver(createChurchSchema) });

  const {
    register: regInvite,
    handleSubmit: handleInvite,
    reset: resetInvite,
    formState: { errors: inviteErrors },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });

  const onCreateSubmit = async (data: CreateChurchForm) => {
    try {
      await createChurch.mutateAsync(data);
      toast.success(`Church "${data.name}" created`);
      resetCreate();
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create church");
    }
  };

  const onInviteSubmit = async (data: InviteForm) => {
    try {
      await inviteMember.mutateAsync({ ...data, role: inviteRole });
      toast.success(`Invite sent to ${data.email}`);
      resetInvite();
      setInviteRole("MEMBER");
      setInviteOpen(false);
    } catch {
      toast.error("Failed to send invite");
    }
  };

  const handleOpenDetail = (
    church: Church & { _count: { members: number } },
  ) => {
    setSelectedChurch(church);
    setDetailOpen(true);
  };

  const handleOpenDelete = (
    e: React.MouseEvent,
    church: Church & { _count: { members: number } },
  ) => {
    e.stopPropagation();
    setSelectedChurch(church);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedChurch) return;
    try {
      await deleteChurch.mutateAsync(selectedChurch.id);
      toast.success(`"${selectedChurch.name}" deleted`);
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelectedChurch(null);
    } catch {
      toast.error("Failed to delete church");
    }
  };

  const totalMembers = churches.reduce(
    (sum, c) => sum + ((c as any)._count?.members ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Churches</h1>
          <p className="text-muted-foreground">
            Manage all church communities on the platform
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Church
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        {[
          {
            label: "Total Churches",
            value: churches.length,
            icon: Building2,
            color: "text-primary bg-primary/10",
          },
          {
            label: "Active",
            value: churches.filter((c) => c.isActive).length,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-500/10",
          },
          {
            label: "Total Members",
            value: totalMembers,
            icon: Users,
            color: "text-blue-600 bg-blue-500/10",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    s.color,
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              className="pl-9"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : churches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">
                {debouncedSearch
                  ? "No churches match your search"
                  : "No churches yet"}
              </p>
              {!debouncedSearch && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create the first church
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Church</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(churches as any[]).map((church) => (
                  <TableRow
                    key={church.id}
                    className="cursor-pointer hover:bg-white/80"
                    onClick={() => handleOpenDetail(church)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {church.logo ? (
                          <img
                            src={church.logo}
                            alt={church.name}
                            className="h-8 w-8 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium leading-tight">
                            {church.name}
                          </p>
                          {church.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-55">
                              {church.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        /{church.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {church._count.members}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={church.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {church.isActive ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {church.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(church.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleOpenDelete(e, church)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChurchDetailSheet
        church={selectedChurch}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onInvite={() => setInviteOpen(true)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Church</DialogTitle>
            <DialogDescription>
              Add a new church community to the platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate(onCreateSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Church Name</Label>
                <Input
                  id="name"
                  placeholder="Grace Community Church"
                  {...regCreate("name")}
                  onChange={(e) => {
                    regCreate("name").onChange(e);
                    setValueCreate(
                      "slug",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "-"),
                      { shouldValidate: false },
                    );
                  }}
                />
                {createErrors.name && (
                  <p className="text-sm text-destructive">
                    {createErrors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2 border rounded-md px-3 focus-within:ring-2 focus-within:ring-ring">
                  <span className="text-muted-foreground text-sm select-none">
                    /
                  </span>
                  <input
                    id="slug"
                    className="flex-1 py-2 text-sm bg-transparent outline-none"
                    placeholder="grace-community"
                    {...regCreate("slug")}
                  />
                </div>
                {createErrors.slug && (
                  <p className="text-sm text-destructive">
                    {createErrors.slug.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    optional
                  </span>
                </Label>
                <Input
                  id="description"
                  placeholder="A welcoming community..."
                  {...regCreate("description")}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createChurch.isPending}>
                {createChurch.isPending ? "Creating..." : "Create Church"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join{" "}
              <span className="font-medium">{selectedChurch?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite(onInviteSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  {...regInvite("email")}
                />
                {inviteErrors.email && (
                  <p className="text-sm text-destructive">
                    {inviteErrors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as "ADMIN" | "MEMBER")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                An invite link will be emailed. It expires after 7 days.
              </p>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${selectedChurch?.name}"`}
        description="This will permanently delete the church and all its members. This cannot be undone."
        confirmLabel="Delete Church"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleteChurch.isPending}
      />
    </div>
  );
}

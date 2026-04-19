import { useState, useMemo, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useChurchMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/use-churches";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserPlus,
  Trash2,
  Building2,
  Crown,
  Search,
  Shield,
} from "lucide-react";
import type { ChurchMember } from "@/types";
import { toast } from "sonner";

function getInitials(member: ChurchMember): string {
  if (member.user?.firstName && member.user?.lastName) {
    return `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase();
  }
  return member.user?.email?.[0]?.toUpperCase() ?? "?";
}

function getDisplayName(member: ChurchMember): string {
  if (member.user?.firstName && member.user?.lastName) {
    return `${member.user.firstName} ${member.user.lastName}`;
  }
  return member.user?.email ?? "Unknown";
}

export default function MembersPage() {
  const {
    activeChurchId: storedChurchId,
    userChurches,
    isChurchAdmin,
  } = useAuthStore();
  const activeChurchId = storedChurchId ?? userChurches[0]?.id ?? null;

  // Persist to store so the API client sends x-church-id header
  const { setActiveChurch } = useAuthStore();
  useEffect(() => {
    if (activeChurchId && !storedChurchId) {
      setActiveChurch(activeChurchId);
    }
  }, [activeChurchId, storedChurchId, setActiveChurch]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<ChurchMember | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "MEMBER">(
    "ALL",
  );

  const { data: membersData, isLoading } = useChurchMembers(
    activeChurchId ?? "",
    1,
    100,
  );
  const removeMember = useRemoveMember(activeChurchId ?? "");
  const updateRole = useUpdateMemberRole(activeChurchId ?? "");

  const isAdmin = isChurchAdmin();

  const allMembers = membersData?.data ?? [];
  const totalMembers = membersData?.meta?.total ?? 0;
  const adminCount = allMembers.filter((m) => m.role === "ADMIN").length;
  const memberCount = allMembers.filter((m) => m.role === "MEMBER").length;

  const filtered = useMemo(() => {
    return allMembers.filter((m) => {
      const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        getDisplayName(m).toLowerCase().includes(q) ||
        (m.user?.email ?? "").toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [allMembers, search, roleFilter]);

  const handleRemove = async () => {
    if (!removingMember) return;
    try {
      await removeMember.mutateAsync(removingMember.userId);
      toast.success("Member removed");
      setRemovingMember(null);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleRoleChange = async (
    memberId: string,
    role: "ADMIN" | "MEMBER",
  ) => {
    try {
      await updateRole.mutateAsync({ memberId, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  if (!activeChurchId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title="No church yet"
          description="Join or create a church to view its members."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage church members, roles, and invitations."
              : "View church members."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            label: "Total Members",
            value: isLoading ? "â€”" : totalMembers,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: Crown,
            label: "Admins",
            value: isLoading ? "â€”" : adminCount,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: Shield,
            label: "Members",
            value: isLoading ? "â€”" : memberCount,
            color: "text-green-600",
            bg: "bg-green-50",
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
              <p className="font-bold text-lg leading-none mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as "ALL" | "ADMIN" | "MEMBER")}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Member list */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-16">
            <EmptyState
              icon={Users}
              title={
                search || roleFilter !== "ALL"
                  ? "No matches found"
                  : "No members yet"
              }
              description={
                search || roleFilter !== "ALL"
                  ? "Try adjusting your search or filter."
                  : isAdmin
                    ? "Add your first member using the button above."
                    : "No members have been added yet."
              }
            />
          </div>
        ) : (
          <div className="divide-y">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Member</span>
              <span>Role</span>
              {isAdmin && <span>Actions</span>}
            </div>
            {filtered.map((member: ChurchMember) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3.5 items-center hover:bg-muted/20 transition-colors"
              >
                {/* Member info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getDisplayName(member)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div>
                  {isAdmin ? (
                    <Select
                      value={member.role}
                      onValueChange={(v) =>
                        handleRoleChange(member.id, v as "ADMIN" | "MEMBER")
                      }
                      disabled={updateRole.isPending}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">
                          <span className="flex items-center gap-1.5">
                            <Crown className="h-3 w-3" />
                            Admin
                          </span>
                        </SelectItem>
                        <SelectItem value="MEMBER">
                          <span className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3" />
                            Member
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={
                        member.role === "ADMIN" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {member.role === "ADMIN" ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        "Member"
                      )}
                    </Badge>
                  )}
                </div>

                {/* Actions (admin only) */}
                {isAdmin && (
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setRemovingMember(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {totalMembers} member
          {totalMembers !== 1 ? "s" : ""}
        </p>
      )}

      <AddMemberDialog
        churchId={activeChurchId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <ConfirmDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        title="Remove Member"
        description={`Remove ${removingMember ? getDisplayName(removingMember) : ""} from this church?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemove}
        isLoading={removeMember.isPending}
      />
    </div>
  );
}

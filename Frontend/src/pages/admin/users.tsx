import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAdminUsers } from "@/hooks/use-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { UserDetailModal } from "@/components/user-detail-modal";
import {
  Users,
  MoreHorizontal,
  Mail,
  Shield,
  Ban,
  Trash2,
  UserX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@/types";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [page] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: users, isLoading } = useAdminUsers(page, 100);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback>
                {`${user.firstName} ${user.lastName}`
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-sm text-neutral-500">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const roles = row.original.roles;
        const roleName: string = roles?.[0]?.role?.name || "USER";
        const variant =
          roleName === "SUPER_ADMIN" || roleName === "ADMIN"
            ? "default"
            : "secondary";
        return <Badge variant={variant}>{roleName.replace("_", " ")}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "ACTIVE";
        const variantMap: Record<
          string,
          "success" | "secondary" | "destructive" | "warning"
        > = {
          ACTIVE: "success",
          INACTIVE: "secondary",
          SUSPENDED: "destructive",
          DELETED: "destructive",
        };
        return (
          <Badge variant={variantMap[status] || "secondary"}>{status}</Badge>
        );
      },
    },
    {
      accessorKey: "isEmailVerified",
      header: "Email Status",
      cell: ({ row }) => (
        <Badge variant={row.original.emailVerified ? "success" : "warning"}>
          {row.original.emailVerified ? "Verified" : "Unverified"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setIsModalOpen(true);
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info("Send email to user")}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  toast.warning("Suspend user feature coming soon")
                }
                className="text-yellow-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.error("Deactivate feature coming soon")}
                className="text-orange-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.error("Delete feature coming soon")}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!users?.data || users.data.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage and monitor all users in your system
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Users}
              title="No users found"
              description="There are no users in the system yet."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage and monitor all users in your system
          </p>
        </div>
        <Button onClick={() => toast.info("Export feature coming soon")}>
          Export Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.meta.total})</CardTitle>
          <CardDescription>
            A comprehensive list of all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users.data}
            searchKey="name"
            searchPlaceholder="Search by name or email..."
            pageSize={20}
          />
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}

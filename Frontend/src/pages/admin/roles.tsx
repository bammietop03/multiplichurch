import { useState, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useRoles,
  usePermissions,
  useRolesStatistics,
  useUserRoles,
  useRoleUsers,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissions,
  useCreatePermission,
  useDeletePermission,
  useAssignRoleToUser,
  useRemoveRoleFromUser,
} from "@/hooks/use-roles";
import { useAdminUsers } from "@/hooks/use-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import {
  Shield,
  Key,
  Users,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Search,
  Check,
  X,
  ChevronRight,
  Crown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type {
  RoleWithPermissions,
  Permission,
  UserRoleAssignment,
  PermissionAction,
  PermissionResource,
} from "@/types";

const PERMISSION_ACTIONS: PermissionAction[] = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "MANAGE",
];
const PERMISSION_RESOURCES: PermissionResource[] = [
  "USER",
  "ORGANIZATION",
  "PAYMENT",
  "AUDIT_LOG",
  "FILE",
  "API_KEY",
  "ALL",
];

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [page] = useState(1);

  // Role management state
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);
  const [isViewRoleOpen, setIsViewRoleOpen] = useState(false);
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(
    null
  );
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  );

  // Permission management state
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    action: "" as PermissionAction | "",
    resource: "" as PermissionResource | "",
    description: "",
  });

  // User role assignment state
  const [selectedUserId, setSelectedUserId] = useState("");

  // Queries
  const { data: rolesData, isLoading: rolesLoading } = useRoles(
    page,
    10,
    searchQuery
  );
  const { data: permissionsData, isLoading: permissionsLoading } =
    usePermissions(1, 100);
  const { data: statistics, isLoading: statsLoading } = useRolesStatistics();
  const { data: userRolesData, isLoading: userRolesLoading } = useUserRoles(
    1,
    50
  );
  const { data: roleUsers } = useRoleUsers(selectedRole?.id || "");
  const { data: allUsers } = useAdminUsers(1, 100);

  // Mutations
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPermissions = useAssignPermissions();
  const createPermission = useCreatePermission();
  const deletePermission = useDeletePermission();
  const assignRoleToUser = useAssignRoleToUser();
  const removeRoleFromUser = useRemoveRoleFromUser();

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateRoleOpen && !isEditRoleOpen) {
      setRoleForm({ name: "", description: "" });
      setSelectedPermissionIds([]);
    }
  }, [isCreateRoleOpen, isEditRoleOpen]);

  useEffect(() => {
    if (selectedRole && isEditRoleOpen) {
      setRoleForm({
        name: selectedRole.name,
        description: selectedRole.description || "",
      });
      setSelectedPermissionIds(selectedRole.permissions.map((p) => p.id));
    }
  }, [selectedRole, isEditRoleOpen]);

  const handleCreateRole = async () => {
    await createRole.mutateAsync({
      name: roleForm.name,
      description: roleForm.description || undefined,
      permissionIds:
        selectedPermissionIds.length > 0 ? selectedPermissionIds : undefined,
    });
    setIsCreateRoleOpen(false);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    await updateRole.mutateAsync({
      id: selectedRole.id,
      dto: {
        name: roleForm.name !== selectedRole.name ? roleForm.name : undefined,
        description: roleForm.description,
      },
    });
    // Update permissions if changed
    await assignPermissions.mutateAsync({
      roleId: selectedRole.id,
      dto: { permissionIds: selectedPermissionIds },
    });
    setIsEditRoleOpen(false);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    await deleteRole.mutateAsync(selectedRole.id);
    setIsDeleteRoleOpen(false);
    setSelectedRole(null);
  };

  const handleCreatePermission = async () => {
    if (!permissionForm.action || !permissionForm.resource) return;
    await createPermission.mutateAsync({
      action: permissionForm.action,
      resource: permissionForm.resource,
      description: permissionForm.description || undefined,
    });
    setIsCreatePermissionOpen(false);
    setPermissionForm({ action: "", resource: "", description: "" });
  };

  const handleAssignUserToRole = async () => {
    if (!selectedRole || !selectedUserId) return;
    await assignRoleToUser.mutateAsync({
      userId: selectedUserId,
      roleId: selectedRole.id,
    });
    setSelectedUserId("");
    setIsAssignUserOpen(false);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Role columns
  const roleColumns: ColumnDef<RoleWithPermissions>[] = [
    {
      accessorKey: "name",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                role.isSystem
                  ? "bg-primary/10 text-primary"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {role.isSystem ? (
                <Crown className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{role.name}</span>
                {role.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {role.description || "No description"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const count = row.original.permissions.length;
        return (
          <Badge variant="outline">
            <Key className="h-3 w-3 mr-1" />
            {count} permission{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
    },
    {
      accessorKey: "usersCount",
      header: "Users",
      cell: ({ row }) => (
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {row.original.usersCount}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRole(role);
                  setIsViewRoleOpen(true);
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRole(role);
                  setIsEditRoleOpen(true);
                }}
                disabled={role.isSystem}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRole(role);
                  setIsAssignUserOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Users
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRole(role);
                  setIsDeleteRoleOpen(true);
                }}
                disabled={role.isSystem || role.usersCount > 0}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Permission columns
  const permissionColumns: ColumnDef<Permission>[] = [
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.resource}
        </Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.original.action;
        const colorMap: Record<string, string> = {
          CREATE:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          READ: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          UPDATE:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          DELETE:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          MANAGE:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        };
        return <Badge className={colorMap[action]}>{action}</Badge>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "rolesCount",
      header: "Assigned To",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.rolesCount || 0} role
          {(row.original.rolesCount || 0) !== 1 ? "s" : ""}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => deletePermission.mutate(row.original.id)}
              className="text-destructive"
              disabled={(row.original.rolesCount || 0) > 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // User role columns
  const userRoleColumns: ColumnDef<UserRoleAssignment>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {`${user.firstName || ""} ${user.lastName || ""}`
                  .trim()
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.role.name}</Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Assigned",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            removeRoleFromUser.mutate({
              userId: row.original.userId,
              roleId: row.original.roleId,
            })
          }
        >
          <UserMinus className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and access control
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalRoles || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.systemRoles || 0} system,{" "}
              {statistics?.customRoles || 0} custom
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalPermissions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available permissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Role Assignments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalUserRoles || 0}
            </div>
            <p className="text-xs text-muted-foreground">Users with roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Role</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.topRoles?.[0]?.name || "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.topRoles?.[0]?.usersCount || 0} users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Key className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Users className="h-4 w-4" />
              User Assignments
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === "roles" && (
              <Button onClick={() => setIsCreateRoleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            )}
            {activeTab === "permissions" && (
              <Button onClick={() => setIsCreatePermissionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            )}
          </div>
        </div>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Roles</CardTitle>
                  <CardDescription>
                    Manage roles and their associated permissions
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : rolesData?.data.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No roles found"
                  description="Create your first role to get started"
                  action={{
                    label: "Create Role",
                    onClick: () => setIsCreateRoleOpen(true),
                  }}
                />
              ) : (
                <DataTable
                  columns={roleColumns}
                  data={rolesData?.data || []}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Permissions</CardTitle>
              <CardDescription>
                Manage available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : permissionsData?.data.length === 0 ? (
                <EmptyState
                  icon={Key}
                  title="No permissions found"
                  description="Create permissions to define access control"
                  action={{
                    label: "Create Permission",
                    onClick: () => setIsCreatePermissionOpen(true),
                  }}
                />
              ) : (
                <DataTable
                  columns={permissionColumns}
                  data={permissionsData?.data || []}
                />
              )}
            </CardContent>
          </Card>

          {/* Permission Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Overview of all permissions by resource and action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Resource</th>
                      {PERMISSION_ACTIONS.map((action) => (
                        <th
                          key={action}
                          className="text-center p-3 font-medium"
                        >
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_RESOURCES.map((resource) => (
                      <tr key={resource} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{resource}</td>
                        {PERMISSION_ACTIONS.map((action) => {
                          const exists = permissionsData?.data.some(
                            (p) =>
                              p.action === action && p.resource === resource
                          );
                          return (
                            <td key={action} className="text-center p-3">
                              {exists ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>
                View and manage which users have which roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userRolesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : userRolesData?.data.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No role assignments"
                  description="Assign roles to users to manage their access"
                />
              ) : (
                <DataTable
                  columns={userRoleColumns}
                  data={userRolesData?.data || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions to it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
                placeholder="e.g., Manager, Editor, Viewer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
                placeholder="Brief description of this role"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Permissions</Label>
              <p className="text-sm text-muted-foreground">
                Select the permissions this role should have
              </p>
              <div className="grid gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                {permissionsData?.data.map((permission) => (
                  <div
                    key={permission.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPermissionIds.includes(permission.id)
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => togglePermission(permission.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded flex items-center justify-center ${
                          selectedPermissionIds.includes(permission.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {selectedPermissionIds.includes(permission.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Key className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {permission.action} {permission.resource}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {permission.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedPermissionIds.length} permission(s) selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateRoleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={!roleForm.name || createRole.isPending}
            >
              {createRole.isPending ? <Spinner className="mr-2" /> : null}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
                disabled={selectedRole?.isSystem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                {permissionsData?.data.map((permission) => (
                  <div
                    key={permission.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPermissionIds.includes(permission.id)
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => togglePermission(permission.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded flex items-center justify-center ${
                          selectedPermissionIds.includes(permission.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {selectedPermissionIds.includes(permission.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Key className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {permission.action} {permission.resource}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {permission.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedPermissionIds.length} permission(s) selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRole.isPending || assignPermissions.isPending}
            >
              {(updateRole.isPending || assignPermissions.isPending) && (
                <Spinner className="mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Role Dialog */}
      <Dialog open={isViewRoleOpen} onOpenChange={setIsViewRoleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRole?.isSystem ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <Shield className="h-5 w-5 text-blue-500" />
              )}
              {selectedRole?.name}
              {selectedRole?.isSystem && (
                <Badge variant="secondary">System Role</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRole?.description || "No description"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {selectedRole &&
                    format(new Date(selectedRole.createdAt), "PPP")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="font-medium">{selectedRole?.usersCount || 0}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Permissions ({selectedRole?.permissions.length || 0})
              </h4>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {selectedRole?.permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {permission.resource}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <Badge>{permission.action}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {permission.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {roleUsers && roleUsers.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users with this role ({roleUsers.length})
                  </h4>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {roleUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {`${user.firstName || ""} ${user.lastName || ""}`
                                .trim()
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            user.status === "ACTIVE" ? "success" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewRoleOpen(false)}>
              Close
            </Button>
            {!selectedRole?.isSystem && (
              <Button
                onClick={() => {
                  setIsViewRoleOpen(false);
                  setIsEditRoleOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Role
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Permission Dialog */}
      <Dialog
        open={isCreatePermissionOpen}
        onOpenChange={setIsCreatePermissionOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Define a new permission for the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={permissionForm.action}
                onValueChange={(value: PermissionAction) =>
                  setPermissionForm({ ...permissionForm, action: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resource</Label>
              <Select
                value={permissionForm.resource}
                onValueChange={(value: PermissionResource) =>
                  setPermissionForm({ ...permissionForm, resource: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_RESOURCES.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perm-description">Description</Label>
              <Input
                id="perm-description"
                value={permissionForm.description}
                onChange={(e) =>
                  setPermissionForm({
                    ...permissionForm,
                    description: e.target.value,
                  })
                }
                placeholder="e.g., Can create new users"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreatePermissionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePermission}
              disabled={
                !permissionForm.action ||
                !permissionForm.resource ||
                createPermission.isPending
              }
            >
              {createPermission.isPending && <Spinner className="mr-2" />}
              Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign User to Role Dialog */}
      <Dialog open={isAssignUserOpen} onOpenChange={setIsAssignUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select a user to assign this role to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.data
                    ?.filter(
                      (user) => !roleUsers?.some((ru) => ru.id === user.id)
                    )
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-muted-foreground">
                            ({user.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignUserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUserToRole}
              disabled={!selectedUserId || assignRoleToUser.isPending}
            >
              {assignRoleToUser.isPending && <Spinner className="mr-2" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <ConfirmDialog
        open={isDeleteRoleOpen}
        onOpenChange={setIsDeleteRoleOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteRole}
        variant="destructive"
      />
    </div>
  );
}

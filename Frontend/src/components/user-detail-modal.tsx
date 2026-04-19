import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActivityTimeline } from "@/components/activity-timeline";
import type { TimelineItem } from "@/components/activity-timeline";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Building2,
  Activity,
  Ban,
  UserX,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@/types";
import { toast } from "sonner";

interface UserDetailModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailModal({
  user,
  open,
  onOpenChange,
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState("details");

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Mock activity data - in real app, fetch from API
  const mockActivity: TimelineItem[] = [
    {
      id: "1",
      title: "Account created",
      description: "User registered and verified email",
      timestamp: user.createdAt,
      icon: UserIcon,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "2",
      title: "Profile updated",
      description: "Changed profile information",
      timestamp: user.updatedAt,
      icon: UserIcon,
      iconColor: "text-green-600 dark:text-green-400",
      iconBgColor: "bg-green-100 dark:bg-green-900/20",
    },
  ];

  // Mock organizations - in real app, fetch from API
  const mockOrganizations = [
    { id: "1", name: "Acme Corp", role: "MEMBER", joinedAt: user.createdAt },
    { id: "2", name: "Tech Startup", role: "ADMIN", joinedAt: user.createdAt },
  ];

  const statusVariant =
    user.status === "ACTIVE"
      ? "success"
      : user.status === "SUSPENDED"
      ? "destructive"
      : "secondary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="text-lg">
                {getInitials(`${user.firstName} ${user.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {user.firstName} {user.lastName}
              </DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant={statusVariant}>{user.status || "ACTIVE"}</Badge>
              <Badge variant="default">
                {(user.userRole as string) || "USER"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {(user.userRole as string) || "USER"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDistanceToNow(new Date(user.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Verification Status */}
            <div className="space-y-3">
              <h3 className="font-semibold">Verification Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">Email Verified</span>
                  <Badge variant={user.emailVerified ? "success" : "warning"}>
                    {user.emailVerified ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">2FA Enabled</span>
                  <Badge variant={"secondary"}>No</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold">Admin Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Send email feature coming soon")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.warning("Suspend user feature coming soon")
                  }
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.error("Deactivate feature coming soon")}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.error("Delete feature coming soon")}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityTimeline items={mockActivity} />
          </TabsContent>

          <TabsContent value="organizations" className="space-y-4 mt-4">
            {mockOrganizations.length > 0 ? (
              <div className="space-y-3">
                {mockOrganizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Joined{" "}
                          {formatDistanceToNow(new Date(org.joinedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={org.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {org.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                Not a member of any organizations
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { useAuthStore } from "@/stores/auth-store";
import { useUserActivity } from "@/hooks/use-users";
import { useChurchMembers } from "@/hooks/use-churches";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Activity, ArrowUpRight } from "lucide-react";

export default function DashboardOverview() {
  const { user, userChurches, activeChurchId } = useAuthStore();
  const { isLoading: activityLoading } = useUserActivity(1, 10);
  const { data: membersData, isLoading: membersLoading } = useChurchMembers(
    activeChurchId ?? "",
  );

  const currentChurch =
    userChurches?.find((c) => c.id === activeChurchId) ?? userChurches?.[0];
  const memberCount = membersData?.meta?.total ?? 0;
  const currentRole = currentChurch?.role ?? "—";

  const isLoading = activityLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || user?.email || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your church today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Church</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {currentChurch?.name || "No church selected"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentChurch
                ? `/${currentChurch.slug}`
                : "Select a church to get started"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeChurchId ? "Church members" : "Select a church first"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentRole}</div>
            <p className="text-xs text-muted-foreground">
              In {currentChurch?.name || "this church"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Church Info */}
      <div className="">
        {/* Church Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Church</CardTitle>
            <CardDescription>Active church details</CardDescription>
          </CardHeader>
          <CardContent>
            {currentChurch ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/40">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                    {currentChurch.logo ? (
                      <img
                        src={currentChurch.logo}
                        alt={currentChurch.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentChurch.name}</p>
                    <p className="text-xs text-muted-foreground">
                      /{currentChurch.slug}
                    </p>
                  </div>
                  {currentChurch.isActive ? (
                    <Badge
                      variant="default"
                      className="text-green-600 border-green-600 text-xs"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => (window.location.href = "/dashboard/members")}
                >
                  <Users className="h-4 w-4" />
                  View Members
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven't joined a church yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

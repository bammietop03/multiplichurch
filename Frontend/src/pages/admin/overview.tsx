import { Link } from "react-router-dom";
import { useAdminStats } from "@/hooks/use-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Users, Building2, UserCheck, UsersRound } from "lucide-react";

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      description: "All registered users",
    },
    {
      title: "Verified Users",
      value: stats?.verifiedUsers ?? "—",
      icon: UserCheck,
      description: "Email-verified accounts",
    },
    {
      title: "Total Churches",
      value: stats?.totalChurches ?? "—",
      icon: Building2,
      description: "Active church communities",
    },
    {
      title: "Total Members",
      value: stats?.totalMembers ?? "—",
      icon: UsersRound,
      description: "Church memberships across all churches",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview for MultipliChurch
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              to="/admin/churches"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Churches</p>
                <p className="text-sm text-muted-foreground">
                  View and manage church communities
                </p>
              </div>
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">User Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Switch to the user dashboard
                </p>
              </div>
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <UsersRound className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-sm text-muted-foreground">
                  Configure platform settings
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

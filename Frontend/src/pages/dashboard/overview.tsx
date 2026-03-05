import { useAuthStore } from "@/stores/auth-store";
import { useUserActivity } from "@/hooks/use-users";
import { usePaymentHistory } from "@/hooks/use-payments";
import { useFiles } from "@/hooks/use-files";
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
import {
  Building2,
  CreditCard,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardOverview() {
  const { user, userOrganizations } = useAuthStore();
  const { data: payments, isLoading: paymentsLoading } = usePaymentHistory(
    1,
    10
  );
  const { data: activity, isLoading: activityLoading } = useUserActivity(1, 10);
  const { data: files, isLoading: filesLoading } = useFiles(1, 10);

  // Calculate stats
  const totalPayments = payments?.meta?.total || 0;
  const successfulPayments =
    payments?.data?.filter((p) => p.status === "SUCCESS").length || 0;
  const totalFiles = files?.meta?.total || 0;
  const currentOrg = userOrganizations?.[0];

  const stats = [
    {
      title: "Organization",
      value: currentOrg?.name || "Not Set",
      icon: Building2,
      description: currentOrg?.slug || "Create your organization",
      trend: currentOrg ? "Active" : "Setup Required",
      trendUp: !!currentOrg,
    },
    {
      title: "Total Payments",
      value: totalPayments,
      icon: CreditCard,
      description: `${successfulPayments} successful`,
      trend:
        totalPayments > 0
          ? `${Math.round((successfulPayments / totalPayments) * 100)}% success`
          : "N/A",
      trendUp: successfulPayments > 0,
    },
    {
      title: "Activity Events",
      value: activity?.meta?.total || 0,
      icon: Activity,
      description: "Total actions recorded",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Files",
      value: totalFiles,
      icon: FileText,
      description: "Uploaded files",
      trend: totalFiles > 0 ? "+5%" : "N/A",
      trendUp: totalFiles > 0,
    },
  ];

  // Prepare chart data
  const activityChartData =
    activity?.data
      ?.slice(0, 7)
      .reverse()
      .map((log) => ({
        name: new Date(log.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        events: 1,
      })) || [];

  const paymentStatusData = [
    {
      name: "Success",
      value: payments?.data?.filter((p) => p.status === "SUCCESS").length || 0,
    },
    {
      name: "Pending",
      value: payments?.data?.filter((p) => p.status === "PENDING").length || 0,
    },
    {
      name: "Failed",
      value: payments?.data?.filter((p) => p.status === "FAILED").length || 0,
    },
  ].filter((item) => item.value > 0);

  const isLoading = paymentsLoading || activityLoading || filesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        <p className="text-neutral-600 dark:text-neutral-400">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${stat.title === "Organization" && typeof stat.value === "string" ? "text-lg" : ""}`}
              >
                {stat.value}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {stat.description}
                </p>
                {stat.trend !== "N/A" && (
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      stat.trendUp ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {stat.title === "Organization" ? (
                      stat.trendUp ? (
                        <span className="font-medium">{stat.trend}</span>
                      ) : (
                        <span className="font-medium">{stat.trend}</span>
                      )
                    ) : stat.trendUp ? (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3" />
                        {stat.trend}
                      </>
                    )}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>
              Your activity over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={activityChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-neutral-200 dark:stroke-neutral-800"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-62.5 flex items-center justify-center text-neutral-500">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Distribution of payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-62.5 flex items-center justify-center text-neutral-500">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Organizations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity?.data?.length ? (
              <div className="space-y-4">
                {activity.data.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {log.action} <span className="text-neutral-500">•</span>{" "}
                        {log.resource}
                      </p>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Organization</CardTitle>
            <CardDescription>Organization details and settings</CardDescription>
          </CardHeader>
          <CardContent>
            {currentOrg ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded-lg transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentOrg.name}</p>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                      {currentOrg.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentOrg.isActive ? (
                      <Badge variant="success" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  You haven't created an organization yet
                </p>
                <Button
                  onClick={() =>
                    (window.location.href = "/dashboard/organization")
                  }
                >
                  Create Organization
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

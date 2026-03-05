import type { ColumnDef } from "@tanstack/react-table";
import { usePaymentHistory } from "@/hooks/use-payments";
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
import { EmptyState } from "@/components/empty-state";
import { CreditCard, Download, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Payment, PaymentStatus } from "@/types";
import { toast } from "sonner";

const statusVariantMap: Record<
  PaymentStatus,
  "success" | "warning" | "destructive" | "secondary"
> = {
  SUCCESS: "success",
  PENDING: "warning",
  PROCESSING: "warning",
  FAILED: "destructive",
  CANCELLED: "secondary",
  REFUNDED: "secondary",
};

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePaymentHistory(1, 100);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {new Date(row.original.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-neutral-500">
            {formatDistanceToNow(new Date(row.original.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.description || "Payment"}
          </span>
          <span className="text-xs text-neutral-500">
            via {row.original.provider.toLowerCase()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatAmount(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return <Badge variant={statusVariantMap[status]}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: () => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.info("Download receipt feature coming soon")}
        >
          <Download className="h-4 w-4 mr-2" />
          Receipt
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
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

  if (!payments?.data || payments.data.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            View and manage your payment transactions
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="You haven't made any payments. Your payment history will appear here once you make a transaction."
              action={{
                label: "Make a Payment",
                onClick: () => toast.info("Payment feature coming soon"),
              }}
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
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            View and manage your payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info("Refresh feature")}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => toast.info("Export feature coming soon")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({payments.meta.total})</CardTitle>
          <CardDescription>
            A comprehensive list of all your payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={payments.data}
            searchKey="description"
            searchPlaceholder="Search transactions..."
            pageSize={20}
          />
        </CardContent>
      </Card>
    </div>
  );
}

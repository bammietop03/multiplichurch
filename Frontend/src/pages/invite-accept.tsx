import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGetInvite, useAcceptInvite } from "@/hooks/use-churches";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { isAuthenticated } = useAuthStore();

  const { data: invite, isLoading, error } = useGetInvite(token);
  const acceptMutation = useAcceptInvite();

  useEffect(() => {
    // If no token is provided, redirect to home
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  const handleAccept = async () => {
    if (!token) return;

    if (!isAuthenticated) {
      // Redirect to register with token preserved in URL
      navigate(`/register?redirect=/invite?token=${token}`);
      return;
    }

    try {
      await acceptMutation.mutateAsync(token);
      toast.success("You've successfully joined the church!");
      navigate("/dashboard/churches");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to accept invite");
    }
  };

  const handleLogin = () => {
    navigate(`/login?redirect=/invite?token=${token}`);
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join a church community.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Church</span>
              <span className="font-medium">
                {invite.church?.name ?? "Unknown Church"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Role</span>
              <Badge
                variant={invite.role === "ADMIN" ? "default" : "secondary"}
              >
                {invite.role}
              </Badge>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                You need to be signed in to accept this invitation.
              </p>
              <Button className="w-full" onClick={handleAccept}>
                Create Account & Accept
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogin}
              >
                Sign In & Accept
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

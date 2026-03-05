import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyEmail = useVerifyEmail();
  const { user, setUser } = useAuthStore();
  const [email, setEmail] = useState(searchParams.get("email") || user?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  // If user is already verified, redirect to dashboard
  useEffect(() => {
    if (user?.emailVerified) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      await apiClient.post("/auth/resend-verification", { email });
      toast.success("Verification code sent! Check your email.");
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (code.length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }

    try {
      await verifyEmail.mutateAsync({ email, code });
      
      // Update user in auth store after successful verification
      if (user) {
        setUser({ ...user, emailVerified: true, emailVerifiedAt: new Date().toISOString() });
      }
      
      // Navigate to dashboard after a short delay to show success message
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (err) {
      // Error is already handled by the mutation
    }
  };

  // Verification successful
  if (verifyEmail.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Email verified!
            </CardTitle>
            <CardDescription className="text-center">
              Your email address has been successfully verified. You can now
              access all features of your account.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Verification form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Verify your email
          </CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit verification code sent to your email address
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={verifyEmail.isPending || !!user}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                }}
                disabled={verifyEmail.isPending}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
              />
            </div>
            {(error || verifyEmail.isError) && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5" />
                  <span>
                    {error ||
                      (verifyEmail.error as Error)?.message ||
                      "Invalid or expired verification code"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={verifyEmail.isPending || !email || code.length !== 6}
            >
              {verifyEmail.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
            <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
              <span>Didn't receive the code?</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleResendCode}
                disabled={isResending || !email}
                className="h-auto p-0"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            </div>
            {!user && (
              <div className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

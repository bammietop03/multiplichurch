import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, Mail, Building2 } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyEmail = useVerifyEmail();
  const { user, setUser } = useAuthStore();
  const [email, setEmail] = useState(
    searchParams.get("email") || user?.email || "",
  );
  const redirect = searchParams.get("redirect");
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
        setUser({
          ...user,
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        });
      }

      // Navigate to redirect destination (e.g. invite accept) or dashboard
      setTimeout(() => {
        navigate(redirect || "/dashboard", { replace: true });
      }, 1500);
    } catch (err) {
      // Error is already handled by the mutation
    }
  };

  // Verification successful
  if (verifyEmail.isSuccess) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">MultipliChurch</span>
          </Link>
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold">You're verified!</h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Your email is confirmed. Welcome to MultipliChurch.
            </p>
          </div>
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} MultipliChurch. All rights reserved.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md space-y-7 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Email verified!</h1>
              <p className="text-muted-foreground mt-2">
                Your email has been verified. You can now access all features.
              </p>
            </div>
            <Button
              className="w-full h-11 text-base"
              onClick={() => navigate("/dashboard")}
            >
              Go to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verification form
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-white">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">MultipliChurch</span>
        </Link>
        <div className="space-y-8">
          <div>
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-3">
              Verify your email
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              We sent a 6-digit code to your email. Enter it to activate your
              account.
            </p>
          </div>
        </div>
        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} MultipliChurch. All rights reserved.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md space-y-7">
          <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">MultipliChurch</span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Verify your email
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Enter the 6-digit code sent to your email address
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={verifyEmail.isPending || !!user}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Verification code</Label>
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
                className="h-11 text-center text-2xl tracking-widest font-mono"
                required
              />
            </div>

            {(error || verifyEmail.isError) && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {error ||
                    (verifyEmail.error as Error)?.message ||
                    "Invalid or expired verification code"}
                </span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={verifyEmail.isPending || !email || code.length !== 6}
            >
              {verifyEmail.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify email"
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <span>Didn't receive the code?</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleResendCode}
              disabled={isResending || !email}
              className="h-auto p-0 text-primary"
            >
              {isResending ? "Sending..." : "Resend code"}
            </Button>
          </div>

          {!user && (
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { useNavigate } from "react-router-dom";

export function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await apiClient.post("/auth/resend-verification", { email: user.email });
      toast.success("Verification code sent! Check your email.");
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyEmail = () => {
    navigate(`/verify-email?email=${encodeURIComponent(user.email)}`);
  };

  return (
    <Alert variant="warning" className="mb-4 relative">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium">Email not verified.</span> Check your
          email for a 6-digit code or enter it now to verify your account.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleVerifyEmail}>
            Verify Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend Code"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

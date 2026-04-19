import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useResetPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, ArrowLeft, Building2, Lock } from "lucide-react";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const resetPassword = useResetPassword();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      await resetPassword.mutateAsync({
        token,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch {
      // Error is handled by mutation
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md text-center space-y-5">
          <h1 className="text-2xl font-bold text-destructive">
            Invalid Reset Link
          </h1>
          <p className="text-muted-foreground">
            The password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link to="/forgot-password">
            <Button className="w-full h-11">Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
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
            <h2 className="text-3xl font-bold">Password updated</h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Your password has been reset. You can now sign in with your new
              password.
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
              <h1 className="text-2xl font-bold">Password reset successful</h1>
              <p className="text-muted-foreground mt-2">
                Your password has been updated. You can now sign in.
              </p>
            </div>
            <Button
              className="w-full h-11 text-base"
              onClick={() => navigate("/login")}
            >
              Continue to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-3">
              Create a new password
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Choose a strong password to keep your account secure.
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
              Reset your password
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Enter your new password below
            </p>
          </div>

          {resetPassword.isError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {(resetPassword.error as Error)?.message ||
                "Failed to reset password. The link may have expired."}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className="h-11"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="h-11"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

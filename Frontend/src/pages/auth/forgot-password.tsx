import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Mail, Building2, Check } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword.mutateAsync(data);
      setIsSubmitted(true);
    } catch {
      // Error is handled by mutation
    }
  };

  if (isSubmitted) {
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
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold">Check your inbox</h2>
            <p className="text-white/75 text-lg leading-relaxed">
              A reset link is on its way. It may take a minute to arrive.
            </p>
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
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-muted-foreground mt-1.5">
                We've sent a reset link to{" "}
                <span className="font-medium text-foreground">
                  {getValues("email")}
                </span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary hover:underline font-medium"
              >
                try another email address
              </button>
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full h-11">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
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
            <h2 className="text-3xl font-bold leading-tight mb-3">
              Forgot your password?
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              No worries — enter your email and we'll send you a secure link to
              reset it.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "Secure reset link sent to your email",
              "Link expires after 1 hour",
              "No account changes until you confirm",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/90 text-sm">{item}</span>
              </li>
            ))}
          </ul>
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
              Forgot password?
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {forgotPassword.isError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {(forgotPassword.error as Error)?.message ||
                "Failed to send reset email. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={forgotPassword.isPending}
            >
              {forgotPassword.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                "Send reset link"
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

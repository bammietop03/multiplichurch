import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
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
import { toast } from "sonner";
import { Shield, Lock, ArrowLeft } from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      const result = await login.mutateAsync(data);

      // Check if user has admin role
      const userRole = result.user?.userRole;
      const hasAdminRole = userRole === "SUPER_ADMIN";

      console.log("Has admin role:", hasAdminRole);

      if (!hasAdminRole) {
        toast.error("Access denied. Admin privileges required.");
        // Logout the user since they don't have admin access
        useAuthStore.getState().logout();
        localStorage.removeItem("auth-storage");
        return;
      }

      toast.success("Welcome to Admin Dashboard!");
      navigate("/admin");
    } catch (error) {
      toast.error((error as Error)?.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[24px_24px]"></div>

      <div className="relative w-full max-w-md">
        {/* Back to home link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-white/20 bg-white/10 backdrop-blur-sm shadow-2xl text-white">
          <CardHeader className="space-y-4 pb-4">
            {/* Admin icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-white">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-center text-white/70">
                Secure access for administrators only
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-300">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white pr-10"
                    {...register("password")}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Security notice */}
              <div className="rounded-lg bg-white/10 border border-white/20 p-3">
                <p className="text-xs text-white/60 text-center">
                  🔒 This is a secure area. All login attempts are logged and
                  monitored.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-white text-primary hover:bg-white/90 font-medium shadow-lg"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Access Admin Panel
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-sm">
                <Link
                  to="/forgot-password"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
                <span className="text-white/30">•</span>
                <Link
                  to="/login"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  User Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}

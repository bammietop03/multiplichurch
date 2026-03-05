import { Link } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
          <ShieldAlert className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
        </div>

        <h1 className="text-6xl font-bold text-neutral-900 dark:text-white mb-4">
          403
        </h1>

        <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
          Access Denied
        </h2>

        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

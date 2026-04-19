import { Building2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import type { UserChurch } from "@/types";

export function ChurchSwitcher() {
  const { userChurches, activeChurchId } = useAuthStore();

  const activeChurch =
    userChurches.find((c: UserChurch) => c.id === activeChurchId) ||
    userChurches[0];

  if (!activeChurch) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm bg-background">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="font-medium max-w-40 truncate">{activeChurch.name}</span>
    </div>
  );
}

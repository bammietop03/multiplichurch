import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        No activity to display
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-neutral-200 dark:bg-neutral-800" />

      {/* Timeline items */}
      <div className="space-y-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                  item.iconBgColor || "bg-blue-100 dark:bg-blue-900/20"
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      item.iconColor || "text-blue-600 dark:text-blue-400"
                    )}
                  />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

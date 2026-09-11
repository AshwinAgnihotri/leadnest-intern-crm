import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="crm-empty">
      <div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
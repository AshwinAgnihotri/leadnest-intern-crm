import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-background/55 px-3 py-2 text-base shadow-sm backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:bg-background/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };

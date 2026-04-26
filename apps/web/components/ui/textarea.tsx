import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div>
        {label && <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "min-h-[120px] w-full rounded-md border border-neutral-100 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-neutral-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };

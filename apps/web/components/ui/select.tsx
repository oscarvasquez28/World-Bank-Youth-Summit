import * as React from "react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, className, children, ...props }, ref) => {
  return (
    <div>
      {label && <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</label>}
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-neutral-700 dark:bg-zinc-800 dark:text-zinc-100",
            className
          )}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500 dark:text-zinc-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-zinc-500">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
});

Select.displayName = "Select";

export { Select };

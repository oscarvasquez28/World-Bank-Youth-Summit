import * as React from "react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, className, children, ...props }, ref) => {
  return (
    <div>
      {label && <label className="mb-2 block text-sm font-medium">{label}</label>}
      <select
        ref={ref}
        className={cn("w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50", className)}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

Select.displayName = "Select";

export { Select };

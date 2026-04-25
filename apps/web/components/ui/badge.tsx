import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800", className)}>
      {children}
    </span>
  );
};

export { Badge };

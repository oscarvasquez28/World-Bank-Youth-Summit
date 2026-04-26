import * as React from "react";
import { cn } from "@/lib/utils";

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-800 dark:border-neutral-700",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Card };

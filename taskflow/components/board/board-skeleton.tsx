"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4 p-4 md:p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 p-3"
        >
          <Skeleton className="mb-3 h-5 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 3 - i }).map((_, j) => (
              <Skeleton key={j} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

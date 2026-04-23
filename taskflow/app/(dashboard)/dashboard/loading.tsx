import { BoardListSkeleton } from "@/components/dashboard/board-list-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <BoardListSkeleton />
    </div>
  );
}

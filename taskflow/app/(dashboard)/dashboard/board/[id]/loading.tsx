import { BoardSkeleton } from "@/components/board/board-skeleton";

export default function BoardLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-2 md:px-6">
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      </div>
      <BoardSkeleton />
    </div>
  );
}

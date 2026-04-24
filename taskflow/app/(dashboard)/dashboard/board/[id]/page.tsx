import { getBoard } from "@/lib/actions/board-actions";
import { BoardView } from "@/components/board/board-view";
import { BoardHeader } from "@/components/board/board-header";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoard(id);

  if (!board) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col max-md:min-h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-3 border-b px-4 py-2 md:px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Boards</span>
        </Link>
        <BoardHeader
          boardId={board.id}
          title={board.title}
          description={board.description}
        />
      </div>
      <BoardView board={board} />
    </div>
  );
}

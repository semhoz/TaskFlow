import { getBoards } from "@/lib/actions/board-actions";
import { BoardList } from "@/components/dashboard/board-list";

export default async function DashboardPage() {
  const boards = await getBoards();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">My Boards</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage your Kanban boards
        </p>
      </div>
      <BoardList initialBoards={boards} />
    </div>
  );
}

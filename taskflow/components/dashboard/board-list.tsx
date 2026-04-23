"use client";

import { useState } from "react";
import Link from "next/link";
import { Board } from "@/lib/types";
import {
  createBoard,
  deleteBoard,
  updateBoard,
} from "@/lib/actions/board-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  LayoutDashboard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function BoardList({ initialBoards }: { initialBoards: Board[] }) {
  const [boards, setBoards] = useState(initialBoards);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createBoard(formData);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setBoards((prev) => [result.data as Board, ...prev]);
      setOpen(false);
      toast.success("Board created");
    }
    setCreating(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBoard || saving) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateBoard(editingBoard.id, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      setBoards((prev) =>
        prev.map((b) =>
          b.id === editingBoard.id
            ? { ...b, title, description, updated_at: new Date().toISOString() }
            : b
        )
      );
      setEditOpen(false);
      setEditingBoard(null);
      toast.success("Board updated");
    }
    setSaving(false);
  }

  async function handleDelete(boardId: string) {
    const result = await deleteBoard(boardId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success("Board deleted");
    }
  }

  function openEdit(board: Board) {
    setEditingBoard(board);
    setEditOpen(true);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <button className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary" />
            }
          >
            <Plus className="size-8" />
            <span className="text-sm font-medium">New Board</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                name="title"
                placeholder="Board title"
                required
                autoFocus
              />
              <Textarea
                name="description"
                placeholder="Description (optional)"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {boards.map((board) => (
          <div key={board.id} className="group relative">
            <Link
              href={`/dashboard/board/${board.id}`}
              className="flex h-40 flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-2">
                <LayoutDashboard className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{board.title}</h3>
                  {board.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {board.description}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Updated{" "}
                {formatDistanceToNow(new Date(board.updated_at), {
                  addSuffix: true,
                })}
              </p>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(board)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(board.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Edit Board Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditingBoard(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
          </DialogHeader>
          {editingBoard && (
            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                name="title"
                defaultValue={editingBoard.title}
                placeholder="Board title"
                required
                autoFocus
              />
              <Textarea
                name="description"
                defaultValue={editingBoard.description ?? ""}
                placeholder="Description (optional)"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingBoard(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

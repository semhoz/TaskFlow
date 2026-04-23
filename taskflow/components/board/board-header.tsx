"use client";

import { useState, useRef, useEffect } from "react";
import { updateBoard } from "@/lib/actions/board-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface BoardHeaderProps {
  boardId: string;
  title: string;
  description: string | null;
}

export function BoardHeader({ boardId, title, description }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description ?? "");
  const [displayTitle, setDisplayTitle] = useState(title);
  const [displayDesc, setDisplayDesc] = useState(description);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  async function handleSave() {
    const newTitle = editTitle.trim();
    if (!newTitle) {
      setEditTitle(displayTitle);
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
    setDisplayTitle(newTitle);
    setDisplayDesc(editDesc.trim() || null);

    const formData = new FormData();
    formData.set("title", newTitle);
    formData.set("description", editDesc.trim());

    const result = await updateBoard(boardId, formData);
    if (result.error) {
      toast.error(result.error);
      setDisplayTitle(title);
      setDisplayDesc(description);
    } else {
      toast.success("Board updated");
    }
  }

  function handleCancel() {
    setEditTitle(displayTitle);
    setEditDesc(displayDesc ?? "");
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-7 text-sm font-semibold"
            placeholder="Board title"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <Input
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="h-7 text-xs"
            placeholder="Description (optional)"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
        </div>
        <Button variant="ghost" size="icon-xs" onClick={handleSave}>
          <Check className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={handleCancel}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex flex-1 items-center gap-2 overflow-hidden">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{displayTitle}</h1>
        {displayDesc && (
          <p className="truncate text-xs text-muted-foreground">
            {displayDesc}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setIsEditing(true)}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Pencil className="size-3.5" />
      </Button>
    </div>
  );
}

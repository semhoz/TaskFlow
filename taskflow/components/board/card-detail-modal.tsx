"use client";

import { useState } from "react";
import type { CardWithLabels, Label } from "@/lib/types";
import { LABEL_COLORS } from "@/lib/types";
import { updateCard, deleteCard, toggleCardLabel } from "@/lib/actions/card-actions";
import { createLabel } from "@/lib/actions/label-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Trash2,
  Calendar as CalendarIcon,
  User,
  Tag,
  AlignLeft,
  X,
  Check,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CardDetailModalProps {
  card: CardWithLabels;
  boardId: string;
  labels: Label[];
  onClose: () => void;
  onCardUpdated: (card: CardWithLabels) => void;
  onCardDeleted: (cardId: string) => void;
}

export function CardDetailModal({
  card,
  boardId,
  labels,
  onClose,
  onCardUpdated,
  onCardDeleted,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [assignee, setAssignee] = useState(card.assignee ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card.due_date ? new Date(card.due_date) : undefined
  );
  const [saving, setSaving] = useState(false);
  const [showLabelCreate, setShowLabelCreate] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<string>(LABEL_COLORS[0].value);
  const [boardLabels, setBoardLabels] = useState<Label[]>(labels);
  const [cardLabels, setCardLabels] = useState<Label[]>(card.labels);

  async function handleSave() {
    setSaving(true);
    const updates = {
      title: title.trim() || card.title,
      description: description.trim() || null,
      assignee: assignee.trim() || null,
      due_date: dueDate ? dueDate.toISOString() : null,
    };

    const result = await updateCard(card.id, updates, boardId);
    if (result.error) {
      toast.error(result.error);
    } else {
      onCardUpdated({
        ...card,
        ...updates,
        labels: cardLabels,
      });
      toast.success("Card updated");
    }
    setSaving(false);
  }

  async function handleDelete() {
    const result = await deleteCard(card.id, boardId);
    if (result.error) {
      toast.error(result.error);
    } else {
      onCardDeleted(card.id);
      toast.success("Card deleted");
    }
  }

  async function handleToggleLabel(label: Label) {
    const isActive = cardLabels.some((l) => l.id === label.id);

    if (isActive) {
      setCardLabels((prev) => prev.filter((l) => l.id !== label.id));
    } else {
      setCardLabels((prev) => [...prev, label]);
    }

    const result = await toggleCardLabel(card.id, label.id, boardId, !isActive);
    if (result.error) {
      toast.error(result.error);
      if (isActive) {
        setCardLabels((prev) => [...prev, label]);
      } else {
        setCardLabels((prev) => prev.filter((l) => l.id !== label.id));
      }
    } else {
      onCardUpdated({
        ...card,
        title: title.trim() || card.title,
        description: description.trim() || null,
        assignee: assignee.trim() || null,
        due_date: dueDate ? dueDate.toISOString() : null,
        labels: isActive
          ? cardLabels.filter((l) => l.id !== label.id)
          : [...cardLabels, label],
      });
    }
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;

    const result = await createLabel(boardId, newLabelName.trim(), newLabelColor);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setBoardLabels((prev) => [...prev, result.data as Label]);
      setNewLabelName("");
      setShowLabelCreate(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Card Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            placeholder="Card title"
          />

          {/* Labels */}
          {cardLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cardLabels.map((label) => (
                <Badge
                  key={label.id}
                  className="cursor-pointer gap-1"
                  style={{
                    backgroundColor: label.color,
                    color: "#fff",
                  }}
                  onClick={() => handleToggleLabel(label)}
                >
                  {label.name}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlignLeft className="size-4" />
              Description
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Sidebar fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Labels */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="size-4" />
                Labels
              </div>
              <Popover>
              <PopoverTrigger render={<Button variant="outline" size="sm" className="w-full justify-start" />}>
                <Tag className="mr-2 size-3.5" />
                {cardLabels.length > 0
                  ? `${cardLabels.length} label(s)`
                  : "Add labels"}
              </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2">
                    {boardLabels.map((label) => {
                      const isActive = cardLabels.some(
                        (l) => l.id === label.id
                      );
                      return (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          <span
                            className="size-4 rounded"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="flex-1 text-left">{label.name}</span>
                          {isActive && (
                            <Check className="size-4 text-primary" />
                          )}
                        </button>
                      );
                    })}

                    {showLabelCreate ? (
                      <div className="space-y-2 border-t pt-2">
                        <Input
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Label name"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-1">
                          {LABEL_COLORS.map((c) => (
                            <button
                              key={c.value}
                              onClick={() => setNewLabelColor(c.value)}
                              className={`size-6 rounded ${
                                newLabelColor === c.value
                                  ? "ring-2 ring-primary ring-offset-2"
                                  : ""
                              }`}
                              style={{ backgroundColor: c.value }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleCreateLabel}
                            disabled={!newLabelName.trim()}
                          >
                            Create
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowLabelCreate(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowLabelCreate(true)}
                        className="flex w-full items-center gap-2 rounded-md border-t px-2 pt-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Plus className="size-4" />
                        Create new label
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Due date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarIcon className="size-4" />
                Due date
              </div>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" size="sm" className="w-full justify-start" />}>
                <CalendarIcon className="mr-2 size-3.5" />
                {dueDate ? format(dueDate, "MMM d, yyyy") : "Set date"}
              </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => setDueDate(date ?? undefined)}
                  />
                  {dueDate && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive"
                        onClick={() => setDueDate(undefined)}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Assignee */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Assignee
              </div>
              <Input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Assign to someone..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

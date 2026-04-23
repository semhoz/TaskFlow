export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: string;
  created_at: string;
}

export interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: string;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

export interface CardLabel {
  card_id: string;
  label_id: string;
}

export interface CardWithLabels extends Card {
  labels: Label[];
}

export interface ColumnWithCards extends Column {
  cards: CardWithLabels[];
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithCards[];
  labels: Label[];
}

export const LABEL_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
] as const;

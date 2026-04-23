# TaskFlow — Kanban Project Management Board

A modern, drag-and-drop Kanban board built with Next.js, Supabase, and dnd-kit.

## Features

- **Authentication**: Email/password sign up and sign in
- **Board Management**: Create, edit, and delete boards
- **Columns**: Add, rename, reorder, and delete columns
- **Cards**: Create, edit, delete cards with drag-and-drop between columns
- **Card Details**: Title, description, labels, due dates, and assignees
- **Labels**: Color-coded label system per board
- **Drag & Drop**: Smooth drag-and-drop for both cards and columns with visual feedback
- **Ordering Persistence**: Fractional indexing ensures card/column order survives page reloads
- **Dark Mode**: System-aware with manual toggle
- **Responsive**: Mobile-friendly with touch support (long-press to drag)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
cd taskflow
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL from `supabase/migrations/00001_initial_schema.sql` in the Supabase SQL Editor
3. Copy your project URL and anon key

### 3. Configure environment variables

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push the `taskflow` folder to a GitHub repo
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
taskflow/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login & Register pages
│   ├── (dashboard)/        # Dashboard & Board pages
│   └── layout.tsx          # Root layout
├── components/
│   ├── board/              # Kanban board components
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── actions/            # Server actions (CRUD)
│   ├── supabase/           # Supabase client setup
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
├── supabase/
│   └── migrations/         # Database schema SQL
└── middleware.ts            # Auth middleware
```

## Architecture Decisions

- **Fractional Indexing**: Card/column positions use lexicographic string keys (`fractional-indexing` library) for O(1) reorder operations without bulk updates
- **Optimistic Updates**: UI updates instantly on drag, with server sync in background and rollback on failure
- **Row Level Security**: All database queries are scoped to the authenticated user at the PostgreSQL level
- **Server Actions**: All mutations go through Next.js Server Actions for type-safe server-side execution

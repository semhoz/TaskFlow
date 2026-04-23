-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Boards table
create table public.boards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.boards enable row level security;

create policy "Users can view own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can create boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- Columns table
create table public.columns (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  position text not null,
  created_at timestamptz default now() not null
);

alter table public.columns enable row level security;

create policy "Users can view columns of own boards"
  on public.columns for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can create columns in own boards"
  on public.columns for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can update columns in own boards"
  on public.columns for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete columns in own boards"
  on public.columns for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

-- Cards table
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references public.columns(id) on delete cascade not null,
  title text not null,
  description text,
  position text not null,
  assignee text,
  due_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.cards enable row level security;

create policy "Users can view cards in own boards"
  on public.cards for select
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can create cards in own boards"
  on public.cards for insert
  with check (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can update cards in own boards"
  on public.cards for update
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete cards in own boards"
  on public.cards for delete
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

-- Labels table
create table public.labels (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  name text not null,
  color text not null
);

alter table public.labels enable row level security;

create policy "Users can view labels in own boards"
  on public.labels for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = labels.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can create labels in own boards"
  on public.labels for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = labels.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can update labels in own boards"
  on public.labels for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = labels.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete labels in own boards"
  on public.labels for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = labels.board_id
        and boards.user_id = auth.uid()
    )
  );

-- Card-Labels junction table
create table public.card_labels (
  card_id uuid references public.cards(id) on delete cascade not null,
  label_id uuid references public.labels(id) on delete cascade not null,
  primary key (card_id, label_id)
);

alter table public.card_labels enable row level security;

create policy "Users can view card labels in own boards"
  on public.card_labels for select
  using (
    exists (
      select 1 from public.cards
      join public.columns on columns.id = cards.column_id
      join public.boards on boards.id = columns.board_id
      where cards.id = card_labels.card_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can manage card labels in own boards"
  on public.card_labels for insert
  with check (
    exists (
      select 1 from public.cards
      join public.columns on columns.id = cards.column_id
      join public.boards on boards.id = columns.board_id
      where cards.id = card_labels.card_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete card labels in own boards"
  on public.card_labels for delete
  using (
    exists (
      select 1 from public.cards
      join public.columns on columns.id = cards.column_id
      join public.boards on boards.id = columns.board_id
      where cards.id = card_labels.card_id
        and boards.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_boards_user_id on public.boards(user_id);
create index idx_columns_board_id on public.columns(board_id);
create index idx_columns_position on public.columns(board_id, position);
create index idx_cards_column_id on public.cards(column_id);
create index idx_cards_position on public.cards(column_id, position);
create index idx_labels_board_id on public.labels(board_id);
create index idx_card_labels_card_id on public.card_labels(card_id);
create index idx_card_labels_label_id on public.card_labels(label_id);

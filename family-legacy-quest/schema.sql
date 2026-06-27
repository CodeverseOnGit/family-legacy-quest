-- ============================================================
-- FAMILY LEGACY QUEST — COMPLETE SUPABASE SQL SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

-- profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  points      integer not null default 0,
  created_at  timestamptz not null default now()
);

-- families
create table if not exists public.families (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text not null unique,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- family_members
create table if not exists public.family_members (
  id         uuid primary key default uuid_generate_v4(),
  family_id  uuid not null references public.families(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique(family_id, user_id)
);

-- stories
create table if not exists public.stories (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references public.families(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  prompt       text,
  content      text not null,
  cover_image  text,
  created_at   timestamptz not null default now()
);

-- story_tags
create table if not exists public.story_tags (
  id        uuid primary key default uuid_generate_v4(),
  story_id  uuid not null references public.stories(id) on delete cascade,
  tag       text not null
);

-- comments
create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- reactions
create table if not exists public.reactions (
  id         uuid primary key default uuid_generate_v4(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null,
  unique(story_id, user_id, emoji)
);

-- quests
create table if not exists public.quests (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  description    text not null,
  reward_points  integer not null default 50,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- quest_completions
create table if not exists public.quest_completions (
  id           uuid primary key default uuid_generate_v4(),
  quest_id     uuid not null references public.quests(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique(quest_id, user_id)
);

-- notifications
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- badges
create table if not exists public.badges (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text not null,
  icon        text
);

-- user_badges
create table if not exists public.user_badges (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  unique(user_id, badge_id)
);


-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
create index if not exists idx_stories_family_id        on public.stories(family_id);
create index if not exists idx_stories_author_id        on public.stories(author_id);
create index if not exists idx_stories_created_at       on public.stories(created_at desc);
create index if not exists idx_family_members_family_id on public.family_members(family_id);
create index if not exists idx_family_members_user_id   on public.family_members(user_id);
create index if not exists idx_comments_story_id        on public.comments(story_id);
create index if not exists idx_reactions_story_id       on public.reactions(story_id);
create index if not exists idx_notifications_user_id    on public.notifications(user_id);
create index if not exists idx_story_tags_story_id      on public.story_tags(story_id);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.families          enable row level security;
alter table public.family_members    enable row level security;
alter table public.stories           enable row level security;
alter table public.story_tags        enable row level security;
alter table public.comments          enable row level security;
alter table public.reactions         enable row level security;
alter table public.quests            enable row level security;
alter table public.quest_completions enable row level security;
alter table public.notifications     enable row level security;
alter table public.badges            enable row level security;
alter table public.user_badges       enable row level security;


-- ── profiles ──────────────────────────────────────────────
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_select_family" on public.profiles;

-- Users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Users can read profiles of people in the same family
create policy "profiles_select_family" on public.profiles
  for select using (
    id in (
      select fm2.user_id
      from public.family_members fm1
      join public.family_members fm2 on fm1.family_id = fm2.family_id
      where fm1.user_id = auth.uid()
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);


-- ── families ──────────────────────────────────────────────
drop policy if exists "families_select_member"  on public.families;
drop policy if exists "families_insert_any"     on public.families;
drop policy if exists "families_update_creator" on public.families;
drop policy if exists "families_select_code"    on public.families;

-- Members can view their family
create policy "families_select_member" on public.families
  for select using (
    id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );

-- Anyone authenticated can read by invite code (needed for joining)
create policy "families_select_code" on public.families
  for select using (auth.uid() is not null);

-- Any authenticated user can create a family
create policy "families_insert_any" on public.families
  for insert with check (auth.uid() is not null);

-- Only creator can update
create policy "families_update_creator" on public.families
  for update using (auth.uid() = created_by);


-- ── family_members ─────────────────────────────────────────
drop policy if exists "family_members_select" on public.family_members;
drop policy if exists "family_members_insert" on public.family_members;
drop policy if exists "family_members_delete" on public.family_members;

create policy "family_members_select" on public.family_members
  for select using (
    user_id = auth.uid()
    or family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );

create policy "family_members_insert" on public.family_members
  for insert with check (auth.uid() is not null);

create policy "family_members_delete" on public.family_members
  for delete using (user_id = auth.uid());


-- ── stories ───────────────────────────────────────────────
drop policy if exists "stories_select_family" on public.stories;
drop policy if exists "stories_insert_member" on public.stories;
drop policy if exists "stories_update_author" on public.stories;
drop policy if exists "stories_delete_author" on public.stories;

create policy "stories_select_family" on public.stories
  for select using (
    family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );

create policy "stories_insert_member" on public.stories
  for insert with check (
    auth.uid() = author_id
    and family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );

create policy "stories_update_author" on public.stories
  for update using (auth.uid() = author_id);

create policy "stories_delete_author" on public.stories
  for delete using (auth.uid() = author_id);


-- ── story_tags ─────────────────────────────────────────────
drop policy if exists "story_tags_select" on public.story_tags;
drop policy if exists "story_tags_insert" on public.story_tags;
drop policy if exists "story_tags_delete" on public.story_tags;

create policy "story_tags_select" on public.story_tags
  for select using (
    story_id in (
      select s.id from public.stories s
      join public.family_members fm on fm.family_id = s.family_id
      where fm.user_id = auth.uid()
    )
  );

create policy "story_tags_insert" on public.story_tags
  for insert with check (
    story_id in (
      select id from public.stories where author_id = auth.uid()
    )
  );

create policy "story_tags_delete" on public.story_tags
  for delete using (
    story_id in (
      select id from public.stories where author_id = auth.uid()
    )
  );


-- ── comments ──────────────────────────────────────────────
drop policy if exists "comments_select_family" on public.comments;
drop policy if exists "comments_insert_member" on public.comments;
drop policy if exists "comments_delete_author" on public.comments;

create policy "comments_select_family" on public.comments
  for select using (
    story_id in (
      select s.id from public.stories s
      join public.family_members fm on fm.family_id = s.family_id
      where fm.user_id = auth.uid()
    )
  );

create policy "comments_insert_member" on public.comments
  for insert with check (
    auth.uid() = author_id
    and story_id in (
      select s.id from public.stories s
      join public.family_members fm on fm.family_id = s.family_id
      where fm.user_id = auth.uid()
    )
  );

create policy "comments_delete_author" on public.comments
  for delete using (auth.uid() = author_id);


-- ── reactions ─────────────────────────────────────────────
drop policy if exists "reactions_select_family" on public.reactions;
drop policy if exists "reactions_insert_member" on public.reactions;
drop policy if exists "reactions_delete_own"    on public.reactions;

create policy "reactions_select_family" on public.reactions
  for select using (
    story_id in (
      select s.id from public.stories s
      join public.family_members fm on fm.family_id = s.family_id
      where fm.user_id = auth.uid()
    )
  );

create policy "reactions_insert_member" on public.reactions
  for insert with check (
    auth.uid() = user_id
    and story_id in (
      select s.id from public.stories s
      join public.family_members fm on fm.family_id = s.family_id
      where fm.user_id = auth.uid()
    )
  );

create policy "reactions_delete_own" on public.reactions
  for delete using (auth.uid() = user_id);


-- ── quests ────────────────────────────────────────────────
drop policy if exists "quests_select_all" on public.quests;

create policy "quests_select_all" on public.quests
  for select using (auth.uid() is not null);


-- ── quest_completions ─────────────────────────────────────
drop policy if exists "quest_completions_select_own"  on public.quest_completions;
drop policy if exists "quest_completions_insert_own"  on public.quest_completions;

create policy "quest_completions_select_own" on public.quest_completions
  for select using (auth.uid() = user_id);

create policy "quest_completions_insert_own" on public.quest_completions
  for insert with check (auth.uid() = user_id);


-- ── notifications ─────────────────────────────────────────
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_any" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert_any" on public.notifications
  for insert with check (auth.uid() is not null);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);


-- ── badges ────────────────────────────────────────────────
drop policy if exists "badges_select_all" on public.badges;

create policy "badges_select_all" on public.badges
  for select using (auth.uid() is not null);


-- ── user_badges ───────────────────────────────────────────
drop policy if exists "user_badges_select_own"  on public.user_badges;
drop policy if exists "user_badges_insert_any"  on public.user_badges;
drop policy if exists "user_badges_select_family" on public.user_badges;

create policy "user_badges_select_own" on public.user_badges
  for select using (auth.uid() = user_id);

create policy "user_badges_select_family" on public.user_badges
  for select using (
    user_id in (
      select fm2.user_id
      from public.family_members fm1
      join public.family_members fm2 on fm1.family_id = fm2.family_id
      where fm1.user_id = auth.uid()
    )
  );

create policy "user_badges_insert_any" on public.user_badges
  for insert with check (auth.uid() is not null);


-- ────────────────────────────────────────────────────────────
-- REALTIME
-- ────────────────────────────────────────────────────────────
-- Enable realtime for notifications table
alter publication supabase_realtime add table public.notifications;


-- ────────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- SEED DATA — BADGES
-- ────────────────────────────────────────────────────────────
insert into public.badges (name, description, icon) values
  ('Storyteller',    'Shared 10 family stories',   '📖'),
  ('Historian',      'Shared 25 family stories',   '🏛️'),
  ('Legacy Keeper',  'Shared 50 family stories',   '🗝️'),
  ('Memory Master',  'Shared 100 family stories',  '🧠')
on conflict (name) do nothing;


-- ────────────────────────────────────────────────────────────
-- SEED DATA — QUESTS (10 quests)
-- ────────────────────────────────────────────────────────────
insert into public.quests (title, description, reward_points, active) values
  (
    'Share Your First Story',
    'Write and share a memory from your life with your family. Any story counts — big or small!',
    50, true
  ),
  (
    'Upload a Family Photo',
    'Add a cover image to one of your stories or update your profile with a photo from your family album.',
    30, true
  ),
  (
    'Leave 5 Comments',
    'Show your family you''re reading their stories by leaving 5 thoughtful comments on family stories.',
    40, true
  ),
  (
    'React to 10 Stories',
    'Spread some love! Add an emoji reaction to 10 stories from your family members.',
    25, true
  ),
  (
    'Share a Childhood Memory',
    'Write a story about something from your childhood — a toy, a place, a friend, or a favourite day.',
    50, true
  ),
  (
    'Share a Family Recipe',
    'Write down a family recipe along with the story behind it. Who made it? When did you first taste it?',
    60, true
  ),
  (
    'Interview a Family Elder',
    'Ask a parent, grandparent, or older relative about their life and share what you learned as a story.',
    75, true
  ),
  (
    'Create a Holiday Memory',
    'Share a memorable holiday or celebration from your family''s history — the more details, the better!',
    50, true
  ),
  (
    'Write About a Family Tradition',
    'Document a family tradition — how it started, what happens, and why it matters to your family.',
    55, true
  ),
  (
    'Share Advice for Future Generations',
    'Write a story containing wisdom, lessons, or advice you''d want your children or grandchildren to have.',
    65, true
  )
on conflict do nothing;


-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
-- Your schema is ready. Next steps:
-- 1. Run this SQL in Supabase Dashboard → SQL Editor
-- 2. Create storage buckets (see README)
-- 3. Add your .env credentials
-- 4. npm install && npm run dev

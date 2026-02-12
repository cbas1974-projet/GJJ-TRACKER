-- ==============================================================================
-- 🏗️ SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES (GJJ-TRACKER)
-- Copiez ce contenu dans l'éditeur SQL de Supabase pour créer les tables nécessaires.
-- ==============================================================================

-- 1. TABLE: profiles (Pour stocker les noms et ceintures)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  belt_rank text,
  role text default 'student',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Active la sécurité (Row Level Security)
alter table profiles enable row level security;

-- Politique : Chacun peut voir son propre profil
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- 2. TABLE: progress (Pour stocker l'avancement des techniques)
create table if not exists progress (
  user_id uuid references auth.users not null,
  technique_id text not null,
  variation_id text not null,
  video_count int default 0,
  training_count int default 0,
  drill_count int default 0,
  is_planned boolean default false,
  notes text,
  last_practiced timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, technique_id, variation_id)
);

alter table progress enable row level security;

create policy "Users can view own progress." on progress for select using ( auth.uid() = user_id );
create policy "Users can insert own progress." on progress for insert with check ( auth.uid() = user_id );
create policy "Users can update own progress." on progress for update using ( auth.uid() = user_id );
create policy "Users can delete own progress." on progress for delete using ( auth.uid() = user_id );

-- 3. TABLE: history (Pour l'historique détaillé - optionnel mais recommandé)
create table if not exists history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  technique_id text not null,
  variation_id text not null,
  activity_type text check (activity_type in ('video', 'training', 'drill')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table history enable row level security;

create policy "Users can view own history." on history for select using ( auth.uid() = user_id );
create policy "Users can insert own history." on history for insert with check ( auth.uid() = user_id );

-- FIN DU SCRIPT
-- Cliquez sur RUN pour exécuter.

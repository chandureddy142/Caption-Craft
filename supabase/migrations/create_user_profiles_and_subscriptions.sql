-- Migration: Create user profiles and subscriptions sync
-- Tracks user tier: starter, creator_lite, creator_pro, weekly_pro, studio_max

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text not null default 'starter',
subscription_status text not null default 'active',
billing_cycle text default 'monthly',
plan_period_end timestamptz,
created_at timestamptz not null default timezone('utc', now()),
updated_at timestamptz not null default timezone('utc', now())
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

-- Policy: Users can update basic profile info
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

-- Trigger function: automatically insert a row in profiles when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
insert into public.profiles (id, email, plan, subscription_status)
values (
new.id,
new.email,
coalesce(new.raw_user_meta_data->>'plan', 'starter'),
'active'
)
on conflict (id) do update
set email = excluded.email;
return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

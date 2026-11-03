create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null check (length(id) between 1 and 256),
  title text not null check (length(title) <= 100),
  schema_version integer not null default 1,
  message_count integer not null default 0 check (message_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc, id desc);

create table if not exists public.conversation_messages (
  user_id uuid not null,
  conversation_id text not null,
  id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) <= 12000),
  sequence integer not null check (sequence >= 0),
  created_at timestamptz not null default now(),
  grounded_documents jsonb not null default '[]'::jsonb,
  primary key (user_id, conversation_id, id),
  unique (user_id, conversation_id, sequence),
  foreign key (user_id, conversation_id)
    references public.conversations (user_id, id) on delete cascade
);

create index if not exists conversation_messages_page_idx
  on public.conversation_messages (user_id, conversation_id, sequence desc);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create or replace function public.is_institutional_user()
returns boolean
language sql
stable
security definer
set search_path = auth, public, pg_temp
as $$
  select exists (
    select 1
      from auth.users
      where id = auth.uid()
        and email_confirmed_at is not null
        and raw_app_meta_data ->> 'provider' = 'google'
        and lower(email) ~ '@(escola[.]seduc[.]pa[.]gov[.]br|seduc[.]pa[.]gov[.]br)$'
  );
$$;

revoke all on function public.is_institutional_user() from public, anon;
grant execute on function public.is_institutional_user() to authenticated;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = id and (select public.is_institutional_user()))
  with check ((select auth.uid()) = id and (select public.is_institutional_user()));

drop policy if exists "Users manage their own conversations" on public.conversations;
drop policy if exists "Users read their own conversations" on public.conversations;
create policy "Users read their own conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) = user_id and (select public.is_institutional_user()));

drop policy if exists "Users delete their own conversations" on public.conversations;
create policy "Users delete their own conversations"
  on public.conversations for delete to authenticated
  using ((select auth.uid()) = user_id and (select public.is_institutional_user()));

drop policy if exists "Users read their own conversation messages" on public.conversation_messages;
create policy "Users read their own conversation messages"
  on public.conversation_messages for select to authenticated
  using ((select auth.uid()) = user_id and (select public.is_institutional_user()));

drop policy if exists "Users delete their own conversation messages" on public.conversation_messages;
drop policy if exists "Users insert their own conversation messages" on public.conversation_messages;

revoke all on public.profiles, public.conversations, public.conversation_messages
  from public, anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, delete on public.conversations to authenticated;
grant select on public.conversation_messages to authenticated;

create or replace function public.persist_conversation_message(
  p_conversation_id text,
  p_title text,
  p_message_id text,
  p_role text,
  p_content text,
  p_grounded_documents jsonb default '[]'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  next_sequence integer;
begin
  if current_user_id is null or not public.is_institutional_user() then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_role is null or p_role not in ('user', 'assistant')
    or p_title is null
    or p_content is null
    or length(p_conversation_id) not between 1 and 256
    or length(p_message_id) not between 1 and 256
    or length(p_content) not between 1 and 12000
    or jsonb_typeof(coalesce(p_grounded_documents, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_grounded_documents, '[]'::jsonb)) > 5
    or octet_length(coalesce(p_grounded_documents, '[]'::jsonb)::text) > 8192 then
    raise exception 'invalid message';
  end if;

  insert into public.conversations (user_id, id, title)
  values (current_user_id, p_conversation_id, left(p_title, 100))
  on conflict (user_id, id) do nothing;

  perform 1 from public.conversations
    where user_id = current_user_id and id = p_conversation_id
    for update;

  select sequence into next_sequence
    from public.conversation_messages
    where user_id = current_user_id
      and conversation_id = p_conversation_id
      and id = p_message_id;
  if found then
    return next_sequence;
  end if;

  select message_count into next_sequence
    from public.conversations
    where user_id = current_user_id and id = p_conversation_id;

  insert into public.conversation_messages (
    user_id, conversation_id, id, role, content, sequence, grounded_documents
  ) values (
    current_user_id, p_conversation_id, p_message_id, p_role, left(p_content, 12000),
    next_sequence, coalesce(p_grounded_documents, '[]'::jsonb)
  );

  update public.conversations
    set title = case when message_count = 0 then left(p_title, 100) else title end,
        message_count = message_count + 1,
        updated_at = now()
    where user_id = current_user_id and id = p_conversation_id;

  return next_sequence;
end;
$$;

revoke all on function public.persist_conversation_message(text, text, text, text, text, jsonb) from public;
grant execute on function public.persist_conversation_message(text, text, text, text, text, jsonb) to authenticated;

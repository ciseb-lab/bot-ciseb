create table if not exists public.request_rate_counters (
  scope text not null,
  subject_type text not null check (subject_type in ('user', 'ip')),
  subject_id text not null,
  minute_window timestamptz not null,
  minute_count integer not null default 0,
  day_window date,
  day_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, subject_type, subject_id)
);

create table if not exists public.chat_request_leases (
  request_id uuid primary key,
  user_id uuid not null,
  expires_at timestamptz not null
);

create table if not exists public.chat_user_locks (
  user_id uuid primary key
);

create index if not exists chat_request_leases_user_expiry_idx
  on public.chat_request_leases (user_id, expires_at);

alter table public.request_rate_counters enable row level security;
alter table public.chat_request_leases enable row level security;
alter table public.chat_user_locks enable row level security;
revoke all on public.request_rate_counters, public.chat_request_leases, public.chat_user_locks
  from public, anon, authenticated;
create index if not exists request_rate_counters_updated_idx
  on public.request_rate_counters (updated_at);

create or replace function public.consume_request_rate_limit(
  p_scope text,
  p_user_id uuid,
  p_client_ip_hash text,
  p_uid_minute_limit integer,
  p_uid_daily_limit integer,
  p_ip_minute_limit integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_minute timestamptz := date_trunc('minute', now());
  current_day date := (now() at time zone 'UTC')::date;
  user_minute_count integer;
  user_day_count integer;
  ip_minute_count integer;
  retry_seconds integer := 0;
begin
  delete from public.request_rate_counters
    where (scope, subject_type, subject_id) in (
      select scope, subject_type, subject_id
        from public.request_rate_counters
        where updated_at < now() - interval '2 days'
        order by updated_at
        limit 100
    );

  insert into public.request_rate_counters (
    scope, subject_type, subject_id, minute_window, day_window
  ) values
    (p_scope, 'user', p_user_id::text, current_minute, current_day),
    (p_scope, 'ip', p_client_ip_hash, current_minute, null)
  on conflict (scope, subject_type, subject_id) do nothing;

  select case when minute_window = current_minute then minute_count else 0 end,
         case when day_window = current_day then day_count else 0 end
    into user_minute_count, user_day_count
    from public.request_rate_counters
    where scope = p_scope and subject_type = 'user' and subject_id = p_user_id::text
    for update;
  select case when minute_window = current_minute then minute_count else 0 end
    into ip_minute_count
    from public.request_rate_counters
    where scope = p_scope and subject_type = 'ip' and subject_id = p_client_ip_hash
    for update;

  if user_minute_count >= p_uid_minute_limit or ip_minute_count >= p_ip_minute_limit then
    retry_seconds := greatest(1, ceil(extract(epoch from (current_minute + interval '1 minute' - now()))));
  end if;
  if p_uid_daily_limit is not null and user_day_count >= p_uid_daily_limit then
    retry_seconds := greatest(
      retry_seconds,
      greatest(
        1,
        ceil(extract(epoch from (((current_day + 1)::timestamp at time zone 'UTC') - now())))::integer
      )
    );
  end if;

  if retry_seconds > 0 then
    return query select false, retry_seconds;
    return;
  end if;

  update public.request_rate_counters
    set minute_window = current_minute,
        minute_count = user_minute_count + 1,
        day_window = current_day,
        day_count = user_day_count + case when p_uid_daily_limit is null then 0 else 1 end,
        updated_at = now()
    where scope = p_scope and subject_type = 'user' and subject_id = p_user_id::text;
  update public.request_rate_counters
    set minute_window = current_minute,
        minute_count = ip_minute_count + 1,
        updated_at = now()
    where scope = p_scope and subject_type = 'ip' and subject_id = p_client_ip_hash;

  return query select true, 0;
end;
$$;

create or replace function public.acquire_chat_lease(
  p_user_id uuid,
  p_request_id uuid,
  p_max_active integer,
  p_lease_ms integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  active_count integer;
  next_expiration timestamptz;
begin
  insert into public.chat_user_locks (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  perform 1 from public.chat_user_locks where user_id = p_user_id for update;
  delete from public.chat_request_leases where expires_at <= now();
  select count(*), min(expires_at)
    into active_count, next_expiration
    from public.chat_request_leases
    where user_id = p_user_id;
  if active_count >= p_max_active then
    return query select false, greatest(1, ceil(extract(epoch from (next_expiration - now())))::integer);
    return;
  end if;
  insert into public.chat_request_leases (request_id, user_id, expires_at)
    values (p_request_id, p_user_id, now() + make_interval(secs => p_lease_ms / 1000.0));
  return query select true, 0;
end;
$$;

create or replace function public.release_chat_lease(p_request_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.chat_request_leases where request_id = p_request_id;
$$;

revoke all on function public.consume_request_rate_limit(text, uuid, text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.acquire_chat_lease(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.release_chat_lease(uuid) from public, anon, authenticated;
grant execute on function public.consume_request_rate_limit(text, uuid, text, integer, integer, integer) to service_role;
grant execute on function public.acquire_chat_lease(uuid, uuid, integer, integer) to service_role;
grant execute on function public.release_chat_lease(uuid) to service_role;

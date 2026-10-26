-- Friendships, contact lists, and an event audience.
-- events.privacy stays a stored enum and is derived from audience by a trigger.
-- A generated column would reject the inserts that still name privacy (the link route, the seed).
-- The trigger overwrites that value, so those callers stay as they are.
-- can_see_event keeps its signature. A null viewer sees nothing, including "everyone".

create table friendships (
  a uuid not null references people on delete cascade,
  b uuid not null references people on delete cascade,
  requested_by uuid not null references people on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (a, b),
  check (a < b),
  check (requested_by = a or requested_by = b),
  check ((status = 'accepted') = (accepted_at is not null))
);
create index on friendships (b);

create table contact_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references people on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now()
);
create unique index contact_lists_owner_lower_name on contact_lists (owner_id, lower(name));

create table contact_list_members (
  list_id uuid not null references contact_lists on delete cascade,
  person_id uuid not null references people on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, person_id)
);
create index on contact_list_members (person_id);

create function audience_ok(aud jsonb) returns boolean language sql immutable as $$
  select aud is not null
    and jsonb_typeof(aud) = 'object'
    and (select coalesce(array_agg(k order by k), '{}') from jsonb_object_keys(aud) k) = array['exclude', 'include']
    and jsonb_typeof(aud->'include') = 'array'
    and jsonb_typeof(aud->'exclude') = 'array'
    and jsonb_array_length(aud->'include') + jsonb_array_length(aud->'exclude') <= 20
    and not exists (select 1 from jsonb_array_elements_text(aud->'exclude') t where t = 'everyone')
    and (
      not (aud->'include' ? 'everyone')
      or aud->'include' = '["everyone"]'::jsonb
    )
    and (
      select coalesce(bool_and(tok ~ '^(everyone|friends|fof|followers|list:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|group:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'), true)
        and count(*) = count(distinct tok)
      from jsonb_array_elements_text(aud->'include') tok
    )
    and (
      select coalesce(bool_and(tok ~ '^(everyone|friends|fof|followers|list:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|group:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'), true)
        and count(*) = count(distinct tok)
      from jsonb_array_elements_text(aud->'exclude') tok
    )
$$;

alter table events add column audience jsonb not null default '{"include":["everyone"],"exclude":[]}'::jsonb
  check (audience_ok(audience));

update events set audience = case privacy
  when 'everyone' then '{"include":["everyone"],"exclude":[]}'::jsonb
  when 'friends' then '{"include":["friends"],"exclude":[]}'::jsonb
  else '{"include":[],"exclude":[]}'::jsonb
end;

insert into friendships (a, b, requested_by, status, accepted_at)
select least(x.follower_id, x.followee_id),
       greatest(x.follower_id, x.followee_id),
       least(x.follower_id, x.followee_id),
       'accepted',
       now()
from person_follows x
join person_follows y
  on y.follower_id = x.followee_id and y.followee_id = x.follower_id
where x.follower_id < x.followee_id
on conflict do nothing;

alter table events drop constraint events_link_check;
alter table events add constraint events_link_check check (
  source <> 'link' or (
    source_url is not null
    and host_id is null
    and audience->'include' = '["everyone"]'::jsonb
    and audience->'exclude' = '[]'::jsonb
  )
);

create function events_derive_privacy() returns trigger language plpgsql as $$
begin
  if jsonb_array_length(new.audience->'include') = 1
     and new.audience->'include'->>0 = 'everyone'
     and jsonb_array_length(new.audience->'exclude') = 0 then
    new.privacy := 'everyone';
  elsif jsonb_array_length(new.audience->'include') = 0 then
    new.privacy := 'only_me';
  else
    new.privacy := 'friends';
  end if;
  return new;
end $$;

create trigger events_derive_privacy
  before insert or update on events
  for each row execute function events_derive_privacy();

-- placeholder; Groups Contractor owns and replaces this; group:X means members plus admins, not followers
create or replace function is_group_member(viewer uuid, grp uuid) returns boolean language sql stable as $$
  select false
$$;

create function in_audience(viewer uuid, owner uuid, tok text) returns boolean language sql stable as $$
  select case
    when tok = 'everyone' then viewer is not null
    when viewer is null or owner is null then false
    when tok = 'friends' then exists (
      select 1 from friendships f
      where f.status = 'accepted' and f.a = least(viewer, owner) and f.b = greatest(viewer, owner)
    )
    when tok = 'fof' then viewer <> owner and (
      exists (
        select 1 from friendships f
        where f.status = 'accepted' and f.a = least(viewer, owner) and f.b = greatest(viewer, owner)
      )
      or exists (
        select 1
        from friendships f1
        join friendships f2 on f2.status = 'accepted'
        where f1.status = 'accepted'
          and (f1.a = viewer or f1.b = viewer)
          and (f2.a = owner or f2.b = owner)
          and (case when f1.a = viewer then f1.b else f1.a end)
            = (case when f2.a = owner then f2.b else f2.a end)
          and (case when f1.a = viewer then f1.b else f1.a end) not in (viewer, owner)
      )
    )
    when tok = 'followers' then exists (
      select 1 from person_follows p
      where p.follower_id = viewer and p.followee_id = owner
    )
    when tok ~ '^list:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then exists (
      select 1 from contact_lists l
      join contact_list_members m on m.list_id = l.id and m.person_id = viewer
      where l.id = substr(tok, 6)::uuid and l.owner_id = owner
    )
    when tok ~ '^group:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      is_group_member(viewer, substr(tok, 7)::uuid)
    else false
  end
$$;

create function can_see(viewer uuid, owner uuid, aud jsonb) returns boolean language sql stable as $$
  select viewer is not null and (
    (owner is not null and viewer = owner)
    or (
      not exists (
        select 1 from jsonb_array_elements_text(aud->'exclude') tok
        where in_audience(viewer, owner, tok)
      )
      and exists (
        select 1 from jsonb_array_elements_text(aud->'include') tok
        where in_audience(viewer, owner, tok)
      )
    )
  )
$$;

create or replace function can_see_event(viewer uuid, e events) returns boolean language sql stable as $$
  select e.deleted_at is null and can_see(viewer, e.host_id, e.audience)
$$;

insert into _migrations (name) values ('0008_friends_privacy');

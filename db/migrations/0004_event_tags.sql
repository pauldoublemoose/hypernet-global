-- Event tags. Null means the host never set tags, so a kind still maps to tags
-- in the client. An empty array means they set none. Ids are the catalog slugs.

create function event_tags_ok(tags text[]) returns boolean language sql immutable as $$
  select tags is null or (
    cardinality(tags) <= 60
    and cardinality(tags) = (select count(distinct t) from unnest(tags) t)
    and coalesce((select bool_and(t ~ '^[a-z0-9]+(-[a-z0-9]+)*$') from unnest(tags) t), true)
  ) $$;

alter table events add column tags text[] check (event_tags_ok(tags));

insert into _migrations (name) values ('0004_event_tags');

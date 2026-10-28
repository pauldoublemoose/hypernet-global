-- 0015_horizon_audience
-- Horizons keep the same {include, exclude} audience as events.
-- A published horizon starts as everyone. A private one starts as nobody.
-- The owner always sees it. An accepted collaborator always sees it.
-- An exclude hides everyone else. Otherwise an include match is enough.
-- A pending invite is not an include. This file is not applied.

alter table horizons
  add column audience jsonb not null default '{"include":["everyone"],"exclude":[]}'::jsonb;

update horizons set audience = case
  when published_at is not null then '{"include":["everyone"],"exclude":[]}'::jsonb
  else '{"include":[],"exclude":[]}'::jsonb
end;

alter table horizons add constraint horizons_audience_ok check (audience_ok(audience));

create or replace function can_see_horizon(viewer uuid, h horizons) returns boolean language sql stable as $$
  select viewer is not null and (
    (h.owner_id is not null and viewer = h.owner_id)
    or exists (
      select 1 from horizon_collaborators hc
      where hc.horizon_id = h.id and hc.person_id = viewer and hc.accepted_at is not null
    )
    or (
      not exists (
        select 1 from jsonb_array_elements_text(h.audience->'exclude') tok
        where in_audience(viewer, h.owner_id, tok)
      )
      and exists (
        select 1 from jsonb_array_elements_text(h.audience->'include') tok
        where in_audience(viewer, h.owner_id, tok)
      )
    )
  )
$$;

insert into _migrations (name) values ('0015_horizon_audience');

-- 0014_event_invites_visibility
-- 0008 replaces can_see_event before event_invites exists. 0010 creates the table
-- and leaves visibility alone. 0011 stores a co-creator on the rsvp row.
-- The host always sees the event. An accepted admin does too (0010: a pending
-- admin invite grants nothing). An accepted co-creator does too (role cocreator
-- and cocreator_pending false). Anyone else who matches an exclude is hidden,
-- even with an event_invites row. Otherwise an include match or an invite is enough.
-- 0013_message_card_types, on feature/horizon-collaborators, only replaces
-- messages_card_type_check. This file does not touch that constraint.

create or replace function can_see_event(viewer uuid, e events) returns boolean language sql stable as $$
  select e.deleted_at is null and viewer is not null and (
    (e.host_id is not null and viewer = e.host_id)
    or exists (
      select 1 from event_admins a
      where a.event_id = e.id and a.user_id = viewer and a.status = 'accepted'
    )
    or exists (
      select 1 from rsvps r
      where r.event_id = e.id and r.person_id = viewer
        and r.role = 'cocreator' and r.cocreator_pending = false
    )
    or (
      not exists (
        select 1 from jsonb_array_elements_text(e.audience->'exclude') tok
        where in_audience(viewer, e.host_id, tok)
      )
      and (
        exists (
          select 1 from jsonb_array_elements_text(e.audience->'include') tok
          where in_audience(viewer, e.host_id, tok)
        )
        or exists (
          select 1 from event_invites i
          where i.event_id = e.id and i.invitee_id = viewer
        )
      )
    )
  )
$$;

insert into _migrations (name) values ('0014_event_invites_visibility');

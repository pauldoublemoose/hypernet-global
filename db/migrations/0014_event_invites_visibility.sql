-- 0014_event_invites_visibility
-- 0008 replaces can_see_event before event_invites exists. 0010 creates the table
-- and leaves visibility alone. An invite now lets that person see the event.
-- 0013_message_card_types, on feature/horizon-collaborators, only replaces
-- messages_card_type_check. This file does not touch that constraint.

create or replace function can_see_event(viewer uuid, e events) returns boolean language sql stable as $$
  select e.deleted_at is null and (
    can_see(viewer, e.host_id, e.audience)
    or exists (select 1 from event_invites where event_id = e.id and invitee_id = viewer)
  )
$$;

insert into _migrations (name) values ('0014_event_invites_visibility');

-- 0006_rsvp_role — the part a person played at an event, on the rsvp row they already have.
-- Text, not an enum, so a later "multiple and external hosts" change can add a value
-- by altering this check. Null means no explicit role. The event's host_id stays the
-- host for older rows, with no backfill.

alter table rsvps add column role text;

alter table rsvps add constraint rsvps_role_check
  check (role is null or role in ('host', 'cocreator', 'attendee'));

insert into _migrations (name) values ('0006_rsvp_role');

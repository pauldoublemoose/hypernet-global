-- 0010_event_admins — page admins are a status of their own, not an RSVP role.
-- A pending admin invite grants nothing. Decline deletes the row.
-- event_invites records who was invited. It does not change who can see an event.
-- Friends & Privacy will add the invite clause in a later migration.

create table event_admins (
  event_id   uuid not null references events on delete cascade,
  user_id    uuid not null references people on delete cascade,
  invited_by uuid not null references people,
  status     text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index event_admins_user on event_admins (user_id);

alter table events add column only_admins_add_cocreators boolean not null default false;
alter table events add column guests_can_invite boolean not null default true;

create table event_invites (
  event_id   uuid not null references events on delete cascade,
  invitee_id uuid not null references people on delete cascade,
  invited_by uuid not null references people,
  created_at timestamptz not null default now(),
  unique (event_id, invitee_id)
);

insert into _migrations (name) values ('0010_event_admins');

-- 0011_cocreator_policy — who may list themselves as co-creator.
-- Run after 0010. Do not edit 0010.
-- open: anyone who can see the event. request: an admin approves.
-- A request lives on the rsvp row the person already has. Public role stays attendee.
-- cocreator_pending is the request. Approve sets role to cocreator and clears the flag.

alter table events add column cocreator_policy text not null default 'open';

alter table events add constraint events_cocreator_policy_check
  check (cocreator_policy in ('open', 'request'));

alter table rsvps add column cocreator_pending boolean not null default false;

insert into _migrations (name) values ('0011_cocreator_policy');

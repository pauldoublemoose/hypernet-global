-- 0011_cocreator_policy — who may add themselves as co-creator.
-- Run after 0010. Do not edit 0010.
-- open: anyone who can see the event. request: an admin approves. admins: only an admin.
-- The old boolean true becomes admins. false stays open, which is the column default.
-- A request lives on the rsvp row the person already has. Public role stays attendee.
-- cocreator_pending is the request. Approve sets role to cocreator and clears the flag.

alter table events add column cocreator_policy text not null default 'open';

alter table events add constraint events_cocreator_policy_check
  check (cocreator_policy in ('open', 'request', 'admins'));

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'only_admins_add_cocreators'
  ) then
    update events set cocreator_policy = 'admins' where only_admins_add_cocreators;
  end if;
end $$;

alter table rsvps add column cocreator_pending boolean not null default false;

insert into _migrations (name) values ('0011_cocreator_policy');

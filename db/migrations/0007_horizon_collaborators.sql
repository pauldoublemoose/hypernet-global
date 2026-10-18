-- 0007_horizon_collaborators. A row is the invite onto one horizon.
-- Pending (accepted_at null) grants nothing. Accepted (accepted_at set) may edit the name,
-- the description, and the event list. Deleting the horizon stays with the owner.
-- The invite is a chat message. Folded in here: 0001's messages_card_type_check, so that
-- message can use card_type horizon_invite. NULL card_type stays a normal text message.

create table horizon_collaborators (
  horizon_id  uuid not null references horizons on delete cascade,
  person_id   uuid not null references people on delete cascade,
  added_by    uuid not null references people,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (horizon_id, person_id)
);
create index horizon_collaborators_person on horizon_collaborators (person_id);

alter table messages drop constraint messages_card_type_check;
alter table messages add constraint messages_card_type_check
  check (card_type is null or card_type in ('event', 'horizon', 'callout', 'horizon_invite'));

insert into _migrations (name) values ('0007_horizon_collaborators');

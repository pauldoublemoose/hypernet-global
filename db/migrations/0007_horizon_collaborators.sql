-- 0007_horizon_collaborators. People an owner has allowed to edit one horizon.
-- Edit is the name, the description, and the event list. Deleting the horizon stays with the owner.

create table horizon_collaborators (
  horizon_id uuid not null references horizons on delete cascade,
  person_id  uuid not null references people on delete cascade,
  added_by   uuid not null references people,
  created_at timestamptz not null default now(),
  primary key (horizon_id, person_id)
);
create index horizon_collaborators_person on horizon_collaborators (person_id);

insert into _migrations (name) values ('0007_horizon_collaborators');

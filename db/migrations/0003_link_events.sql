-- 0003_link_events — events that already exist elsewhere, added from a link (owner, 2026-10-16: "while filling up the
-- Event horizon you could enter a URL … and then click a button for autofill of event details (time, host etc)").
--   * source 'link': nobody here hosts it (host_id null, host_name is the organiser as the page names it);
--   * source_url is the page it came from, without tracking parameters: one link is one event, so two curators who
--     paste it share one event and one Going list;
--   * added_by is who brought it here: they may correct it (edit / delete) until a host claims it (later);
--   * a link event is public: the page it came from already is.

alter table events drop constraint events_source_check;
alter table events add constraint events_source_check check (source in ('user', 'import', 'link'));

-- 0001's "check (source = 'import' or host_id is not null)", which Postgres named events_check1
alter table events drop constraint events_check1;
alter table events add constraint events_host_check check (source <> 'user' or host_id is not null);

alter table events add column source_url text check (source_url is null or source_url ~ '^https?://');
alter table events add column added_by uuid references people on delete set null;
alter table events add constraint events_link_check
  check (source <> 'link' or (source_url is not null and host_id is null and privacy = 'everyone'));

create unique index events_one_per_link on events (source_url) where source_url is not null and deleted_at is null;
create index events_added_by on events (added_by) where added_by is not null;

insert into _migrations (name) values ('0003_link_events');

-- Optional time table. Null means the event has no blocks. Each block is
-- {title, start, end?} with wall-clock timestamps YYYY-MM-DDTHH:MM, in start order.

create function event_schedule_ok(s jsonb) returns boolean language sql immutable as $$
  select s is null or (
    jsonb_typeof(s) = 'array'
    and jsonb_array_length(s) <= 40
    and coalesce((
      select bool_and(
        jsonb_typeof(b) = 'object'
        and length(btrim(b->>'title')) between 1 and 140
        and b->>'start' ~ '^\d{4}-\d{2}-\d{2}T([01][0-9]|2[0-3]):[0-5][0-9]$'
        and (
          not (b ? 'end')
          or (
            b->>'end' ~ '^\d{4}-\d{2}-\d{2}T([01][0-9]|2[0-3]):[0-5][0-9]$'
            and b->>'end' > b->>'start'
          )
        )
      )
      from jsonb_array_elements(s) b
    ), true)
  ) $$;

alter table events add column schedule jsonb check (event_schedule_ok(schedule));

insert into _migrations (name) values ('0005_event_schedule');

-- 0012_message_card_chronicle — a past-event invite stores a chronicle card.
-- Run after 0011. 0011 stays the co-creator policy, so this check lives on its own.
-- 0001 created messages_card_type_check inline and allowed event, horizon, callout.
-- No later migration on this branch changed that list. Nothing else is written.
-- The drop is idempotent. Do not apply this file by hand.

alter table messages drop constraint if exists messages_card_type_check;

alter table messages add constraint messages_card_type_check
  check (card_type in ('event', 'horizon', 'callout', 'chronicle'));

insert into _migrations (name) values ('0012_message_card_chronicle');

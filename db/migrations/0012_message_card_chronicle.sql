-- 0012_message_card_chronicle — a past-event invite stores a chronicle card.
-- Run after 0011. 0011 stays the co-creator policy, so this check lives on its own.
-- 0001 created messages_card_type_check inline and allowed event, horizon, callout.
-- 0007, which is not on this branch, adds horizon_invite. If that migration runs
-- before this one, the drop below would remove it. The new list is the union:
-- event, horizon, callout, horizon_invite, chronicle. Naming horizon_invite
-- before 0007 lands does no harm.
-- A plain text message stores card_type null. Null already passes a check, and
-- this check says so. The separate (card_type is null) = (card_id is null)
-- check from 0001 is left as it is.
-- The drop is idempotent. Do not apply this file by hand.

alter table messages drop constraint if exists messages_card_type_check;

alter table messages add constraint messages_card_type_check
  check (card_type is null or card_type in ('event', 'horizon', 'callout', 'horizon_invite', 'chronicle'));

insert into _migrations (name) values ('0012_message_card_chronicle');

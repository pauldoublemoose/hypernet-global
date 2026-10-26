-- 0013_message_card_types. The last definition of messages_card_type_check.
-- NULL stays a plain text message.
-- event, horizon, callout are links on a message (0001). horizon_invite is the chat card (0007).
-- chronicle is a past-event invite (0012).
-- Add a new chat card to this list, to lib/chat-cards.ts, and to _shared/chat-cards.js.
-- A friend request is never a card_type.
-- Do not apply this file by hand. 0007 stays as it is.

alter table messages drop constraint if exists messages_card_type_check;

alter table messages add constraint messages_card_type_check
  check (card_type is null or card_type in (
    'event',
    'horizon',
    'callout',
    'horizon_invite',
    'chronicle'
  ));

insert into _migrations (name) values ('0013_message_card_types');

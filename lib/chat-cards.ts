/** Chat cards the server will store. The browser registry is `_shared/chat-cards.js` (phrase, link, buttons).
 *  Add a type in both, and in the IN list of the latest messages_card_type_check migration
 *  (`db/migrations/0013_message_card_types.sql`).
 *  Accept and decline stay on that type's own route. A friend request is never a chat card.
 */
export const chatCards = {
  horizon_invite: {
    type: "horizon_invite",
    linkType: "horizon",
    accept: { method: "POST" as const, path: (id: string) => `/api/horizons/${id}/invites` },
    decline: { method: "DELETE" as const, path: (id: string) => `/api/horizons/${id}/invites` },
    undo: { method: "PATCH" as const, path: (id: string) => `/api/horizons/${id}/invites` },
  },
} as const;

export type ChatCardType = keyof typeof chatCards;

export function chatCard(type: string | null | undefined) {
  if (!type || !Object.prototype.hasOwnProperty.call(chatCards, type)) return null;
  return chatCards[type as ChatCardType];
}

export function requireChatCard(type: ChatCardType) {
  return chatCards[type];
}

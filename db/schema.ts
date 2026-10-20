// Drizzle's view of the tables in db/migrations/*.sql. The SQL files are the source of truth (they also hold the
// CHECK constraints, the privacy functions and the views); this file only gives TypeScript the column names and
// types. When a migration changes a table, change it here in the same commit.
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({ dataType: () => "citext" });
const tstz = (name: string) => timestamp(name, { withTimezone: true });

/** A look (2026-10-01): three #rrggbb colours, an optional square picture URL in our bucket, a glyph; since 2026-10-05
 *  also the picks they come from: [page, accent | null, header | null] (lib/validation.ts checks them). */
export type Look = { bg: string; ink: string; accent: string; image?: string | null; glyph?: string | null; colors?: (string | null)[] | null };

export const privacy = pgEnum("privacy", ["everyone", "friends", "only_me"]);
export const rsvpStatus = pgEnum("rsvp", ["going", "interested"]);

export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: citext("email").notNull().unique(),
  handle: citext("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  skills: text("skills").array().notNull().default([]),
  cities: text("cities").array().notNull().default([]),
  look: jsonb("look").$type<Look | null>(),
  lastSeenAt: tstz("last_seen_at"),
  createdAt: tstz("created_at").notNull().defaultNow(),
  updatedAt: tstz("updated_at").notNull().defaultNow(),
});

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  key: text("key").notNull().unique(),
  url: text("url").notNull().unique(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: tstz("created_at").notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    hostId: uuid("host_id").references(() => people.id),
    hostName: text("host_name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    timezone: text("timezone").notNull().default("Europe/Stockholm"),
    kind: text("kind").notNull().default("meetup"),
    // null means the host never set tags; the client then maps kind. [] means they set none.
    tags: text("tags").array(),
    // null means no time table. Blocks are in start order: { title, start, end? } as wall-clock YYYY-MM-DDTHH:MM.
    schedule: jsonb("schedule").$type<{ title: string; start: string; end?: string }[] | null>(),
    privacy: privacy("privacy").notNull().default("everyone"),
    city: text("city"),
    region: text("region"),
    country: text("country"),
    venue: jsonb("venue").$type<Record<string, unknown> | null>(),
    access: jsonb("access").$type<Record<string, unknown> | null>(),
    whatToBring: text("what_to_bring").array().notNull().default([]),
    details: jsonb("details").$type<Record<string, unknown> | null>(),
    look: jsonb("look").$type<Look | null>(),
    source: text("source").notNull().default("user"),
    sourceUrl: text("source_url"),
    addedBy: uuid("added_by").references(() => people.id, { onDelete: "set null" }),
    previousEditionId: uuid("previous_edition_id"),
    createdAt: tstz("created_at").notNull().defaultNow(),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
    deletedAt: tstz("deleted_at"),
  },
  (t) => [index().on(t.hostId)],
);

export const horizons = pgTable("horizons", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id").references(() => people.id),
  ownerName: text("owner_name"),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isPersonalDefault: boolean("is_personal_default").notNull().default(false),
  publishedAt: tstz("published_at"),
  look: jsonb("look").$type<Look | null>(),
  createdAt: tstz("created_at").notNull().defaultNow(),
});

export const horizonEvents = pgTable(
  "horizon_events",
  {
    horizonId: uuid("horizon_id").notNull().references(() => horizons.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedBy: uuid("added_by").references(() => people.id),
    addedAt: tstz("added_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.horizonId, t.eventId] })],
);

export const rsvps = pgTable(
  "rsvps",
  {
    personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    status: rsvpStatus("status"),
    went: boolean("went").notNull().default(false),
    shiftIndex: integer("shift_index"),
    role: text("role"),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.eventId] })],
);

export const promotions = pgTable(
  "promotions",
  {
    personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.eventId] })],
);

export const personFollows = pgTable(
  "person_follows",
  {
    followerId: uuid("follower_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    followeeId: uuid("followee_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followeeId] })],
);

export const horizonFollows = pgTable(
  "horizon_follows",
  {
    personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    horizonId: uuid("horizon_id").notNull().references(() => horizons.id, { onDelete: "cascade" }),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.horizonId] })],
);

export const callouts = pgTable("callouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull().references(() => people.id),
  eventId: uuid("event_id").references(() => events.id),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  skill: text("skill"),
  expiresOn: date("expires_on").notNull(),
  closedAt: tstz("closed_at"),
  createdAt: tstz("created_at").notNull().defaultNow(),
  updatedAt: tstz("updated_at").notNull().defaultNow(),
});

export const calloutReplies = pgTable("callout_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  calloutId: uuid("callout_id").notNull().references(() => callouts.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: tstz("created_at").notNull().defaultNow(),
});

export const dmThreads = pgTable("dm_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  a: uuid("a").notNull().references(() => people.id),
  b: uuid("b").notNull().references(() => people.id),
  createdAt: tstz("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => dmThreads.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => people.id),
  body: text("body").notNull().default(""),
  cardType: text("card_type"),
  cardId: uuid("card_id"),
  createdAt: tstz("created_at").notNull().defaultNow(),
});

export const threadReads = pgTable(
  "thread_reads",
  {
    threadId: uuid("thread_id").notNull().references(() => dmThreads.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    lastReadAt: tstz("last_read_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.threadId, t.personId] })],
);

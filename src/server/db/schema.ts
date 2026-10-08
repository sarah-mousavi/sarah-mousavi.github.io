import {
  pgTable, serial, text, timestamp, integer, boolean, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ── people ─────────────────────────────────────────────────────── */

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    /* phone is the identity: Iranian clients sign in by SMS code, not email */
    phone: text('phone').notNull(),
    name: text('name'),
    education: text('education'),
    occupation: text('occupation'),
    role: text('role').notNull().default('client'), // client | staff | admin
    /* tier is derived from completed sessions, never written by hand */
    sessionsCompleted: integer('sessions_completed').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_phone_idx').on(t.phone)]
);

/* ── auth: one-time codes + sessions ────────────────────────────── */

export const loginCodes = pgTable(
  'login_codes',
  {
    id: serial('id').primaryKey(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('login_codes_phone_idx').on(t.phone)]
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)]
);

/* ── booking ────────────────────────────────────────────────────── */

export const bookingRequests = pgTable(
  'booking_requests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    education: text('education'),
    occupation: text('occupation'),
    service: text('service').notNull(),
    mode: text('mode').notNull().default('in-person'), // in-person | online
    /* what the client asked for, in their words */
    preferredDays: text('preferred_days'),
    preferredTime: text('preferred_time'),
    message: text('message'),
    status: text('status').notNull().default('new'), // new | contacted | scheduled | closed
    staffNote: text('staff_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('booking_status_idx').on(t.status), index('booking_created_idx').on(t.createdAt)]
);

/* ── outbound messages, so nothing is silently lost ─────────────── */

export const messageLog = pgTable('message_log', {
  id: serial('id').primaryKey(),
  channel: text('channel').notNull().default('sms'),
  to: text('to').notNull(),
  body: text('body').notNull(),
  provider: text('provider').notNull(),
  status: text('status').notNull(), // sent | failed | skipped
  error: text('error'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ── member library: what each tier can open ────────────────────── */

export const libraryItems = pgTable('library_items', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  kind: text('kind').notNull(), // video | reading | worksheet
  summary: text('summary'),
  url: text('url'),
  minTier: text('min_tier').notNull().default('bronze'), // bronze | silver | gold
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ── chatbot transcripts, for safety review ─────────────────────── */

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    conversationId: text('conversation_id').notNull(),
    role: text('role').notNull(), // user | bot
    body: text('body').notNull(),
    flagged: boolean('flagged').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('chat_conv_idx').on(t.conversationId)]
);

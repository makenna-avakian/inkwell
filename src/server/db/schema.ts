import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * User.role is intentionally NOT a field here — seller capability is derived
 * from ShopProfile existence (Unit 2), never stored redundantly.
 * See aidlc-docs/construction/unit-1-auth/functional-design/business-rules.md (BR-8).
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["google"] }).notNull(),
  providerAccountId: text("provider_account_id").notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  succeeded: boolean("succeeded").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type LoginAttempt = typeof loginAttempts.$inferSelect;

// --- Unit 2: Shops & Commission Rules ---
// See aidlc-docs/construction/unit-2-shops/functional-design/domain-entities.md

export const shopProfiles = pgTable("shop_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bannerImageUrl: text("banner_image_url"),
  avatarImageUrl: text("avatar_image_url"),
  bio: text("bio"),
  // Array of { label: string, url: string }
  socialLinks: jsonb("social_links").notNull().default([]),
  // Unit 6 (Orders & Payments) addition — see unit-6-orders/functional-design/domain-entities.md
  stripeConnectAccountId: text("stripe_connect_account_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const portfolioImages = pgTable("portfolio_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shopProfiles.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Append-only — never updated or deleted (BR-4). */
export const commissionRuleVersions = pgTable("commission_rule_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shopProfiles.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  // Array of { id: string, name: string, description: string, priceCents: number }
  tiers: jsonb("tiers").notNull(),
  // Array of { id: string, name: string, priceDeltaCents: number }
  addOns: jsonb("add_ons").notNull(),
  // Array of ContentBlock (see domain-entities.md's Block Schema)
  rulesContent: jsonb("rules_content").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shopCommissionSettings = pgTable("shop_commission_settings", {
  shopId: uuid("shop_id")
    .primaryKey()
    .references(() => shopProfiles.id, { onDelete: "cascade" }),
  currentVersionId: uuid("current_version_id").references(
    () => commissionRuleVersions.id,
  ),
  slotState: text("slot_state", {
    enum: ["open", "closed", "waitlist"],
  })
    .notNull()
    .default("closed"),
  maxQueue: integer("max_queue"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ShopProfile = typeof shopProfiles.$inferSelect;
export type NewShopProfile = typeof shopProfiles.$inferInsert;
export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type CommissionRuleVersion = typeof commissionRuleVersions.$inferSelect;
export type NewCommissionRuleVersion = typeof commissionRuleVersions.$inferInsert;
export type ShopCommissionSettings = typeof shopCommissionSettings.$inferSelect;

// --- Unit 3: Listings ---
// See aidlc-docs/construction/unit-3-listings/functional-design/domain-entities.md

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shopProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  status: text("status", { enum: ["available", "sold", "removed"] })
    .notNull()
    .default("available"),
  // Unit 4 (Discovery) addition — see unit-4-discovery/functional-design/domain-entities.md
  medium: text("medium"),
  styleTags: jsonb("style_tags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const listingImages = pgTable("listing_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  position: integer("position").notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingImage = typeof listingImages.$inferSelect;

// --- Unit 5: Commission Requests & Messaging ---
// See aidlc-docs/construction/unit-5-requests/functional-design/domain-entities.md

export const commissionRequests = pgTable("commission_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shopProfiles.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ruleVersionId: uuid("rule_version_id")
    .notNull()
    .references(() => commissionRuleVersions.id),
  tierId: text("tier_id").notNull(),
  addOnIds: jsonb("add_on_ids").notNull().default([]),
  description: text("description").notNull(),
  referenceImageUrls: jsonb("reference_image_urls").notNull().default([]),
  budgetCents: integer("budget_cents"),
  deadlinePreference: text("deadline_preference"),
  status: text("status", { enum: ["requested", "accepted", "declined"] })
    .notNull()
    .default("requested"),
  declineReason: text("decline_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shopProfiles.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.shopId, table.buyerId)], // BR-3: idempotent join
);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => commissionRequests.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  attachmentUrls: jsonb("attachment_urls").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const requestReadReceipts = pgTable(
  "request_read_receipts",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => commissionRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.requestId, table.userId] })],
);

export type CommissionRequest = typeof commissionRequests.$inferSelect;
export type NewCommissionRequest = typeof commissionRequests.$inferInsert;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type RequestReadReceipt = typeof requestReadReceipts.$inferSelect;

// --- Unit 6: Orders & Payments ---
// See aidlc-docs/construction/unit-6-orders/functional-design/domain-entities.md

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").references(() => commissionRequests.id),
  listingId: uuid("listing_id").references(() => listings.id),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id),
  subtotalCents: integer("subtotal_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  sellerNetCents: integer("seller_net_cents").notNull(),
  status: text("status", {
    enum: ["accepted", "in_progress", "delivered", "completed", "cancelled"],
  })
    .notNull()
    .default("accepted"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const processedWebhookEvents = pgTable("processed_webhook_events", {
  stripeEventId: text("stripe_event_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ProcessedWebhookEvent = typeof processedWebhookEvents.$inferSelect;

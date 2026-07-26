import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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

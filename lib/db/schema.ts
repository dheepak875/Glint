import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverPhotoId: text("cover_photo_id"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  passwordHash: text("password_hash"),
  /** At most one album has this set — when set, the homepage shows its photos directly
   * instead of the album-list view. Enforced in application code, not the schema. */
  showOnHomepage: integer("show_on_homepage", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  albumId: text("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  thumbnailPath: text("thumbnail_path").notNull(),
  mediumPath: text("medium_path").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  exifJson: text("exif_json", { mode: "json" }).$type<Record<string, unknown> | null>(),
  sortOrder: integer("sort_order").notNull().default(0),
  uploadedAt: text("uploaded_at").notNull().default(sql`(current_timestamp)`),
});

export const likes = sqliteTable(
  "likes",
  {
    id: text("id").primaryKey(),
    photoId: text("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("likes_photo_fingerprint_idx").on(table.photoId, table.fingerprint)],
);

export const commentStatusValues = ["pending", "approved", "rejected"] as const;
export const aiVerdictValues = ["approve", "reject", "review"] as const;

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  photoId: text("photo_id")
    .notNull()
    .references(() => photos.id, { onDelete: "cascade" }),
  authorName: text("author_name"),
  body: text("body").notNull(),
  status: text("status", { enum: commentStatusValues }).notNull().default("pending"),
  aiVerdict: text("ai_verdict", { enum: aiVerdictValues }),
  aiReason: text("ai_reason"),
  aiFlags: text("ai_flags", { mode: "json" }).$type<string[] | null>(),
  fingerprint: text("fingerprint").notNull(),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export interface SiteLink {
  label: string;
  url: string;
}

/** Single row (id = 1), created on first save from the admin settings page. */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteTitle: text("site_title").notNull().default("Glint"),
  siteDescription: text("site_description"),
  about: text("about"),
  contactEmail: text("contact_email"),
  links: text("links", { mode: "json" }).$type<SiteLink[]>(),
  theme: text("theme", { enum: ["light", "dark"] })
    .notNull()
    .default("dark"),
});

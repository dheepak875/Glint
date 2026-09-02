CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`cover_photo_id` text,
	`is_public` integer DEFAULT true NOT NULL,
	`password_hash` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_slug_unique` ON `albums` (`slug`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`photo_id` text NOT NULL,
	`author_name` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ai_verdict` text,
	`ai_reason` text,
	`ai_flags` text,
	`fingerprint` text NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` text PRIMARY KEY NOT NULL,
	`photo_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `likes_photo_fingerprint_idx` ON `likes` (`photo_id`,`fingerprint`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`album_id` text NOT NULL,
	`filename` text NOT NULL,
	`storage_path` text NOT NULL,
	`thumbnail_path` text NOT NULL,
	`medium_path` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`exif_json` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`uploaded_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_title` text DEFAULT 'Glint' NOT NULL,
	`site_description` text,
	`theme` text DEFAULT 'dark' NOT NULL
);

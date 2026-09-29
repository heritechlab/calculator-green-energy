CREATE TABLE `irradiance_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`source` text NOT NULL,
	`ghi_json` text NOT NULL,
	`temp_json` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`engine_version` text NOT NULL,
	`input_json` text NOT NULL,
	`summary_json` text NOT NULL,
	`location_name` text NOT NULL,
	`system_type` text NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_created_at_idx` ON `reports` (`created_at`);
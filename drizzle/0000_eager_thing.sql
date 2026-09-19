CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`title` text NOT NULL,
	`severity` text NOT NULL,
	`status` text NOT NULL,
	`evidence` text NOT NULL,
	`created` text NOT NULL,
	`resolved` text
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`region` text NOT NULL,
	`cpu` real NOT NULL,
	`memory` real NOT NULL,
	`latency` real NOT NULL,
	`cost` real NOT NULL,
	`source` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `samples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` text NOT NULL,
	`cpu` real NOT NULL,
	`memory` real NOT NULL,
	`latency` real NOT NULL,
	`created` text NOT NULL
);

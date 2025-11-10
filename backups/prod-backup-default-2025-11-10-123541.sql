PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE `users_sessions` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`created_at` text,
  	`expires_at` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
  );
CREATE TABLE `users` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`email` text NOT NULL,
  	`reset_password_token` text,
  	`reset_password_expiration` text,
  	`salt` text,
  	`hash` text,
  	`login_attempts` numeric DEFAULT 0,
  	`lock_until` text
  );
INSERT INTO "users" VALUES(1,'2025-11-10T15:33:35.709Z','2025-11-10T15:33:35.708Z','brad@comparepower.com',NULL,NULL,'2f57e993a7132a451e2a1b2991936a4d6e6cc32d135ebc3f654ee8c275497f35','1faf5c91505022b3d4b5f7a595d4ae728965a1700f7aeda19efcc739a2e5edd721f613434fcc02db5d40bd50858601d2e3b239149abe1796bff398a4f4eea478119ad8fd01ededfa1567c3d7635f3fa6f7dcd02bc03ae5cd1cf72f573497250a87c0c19145eed9f32f00a61a92f4bd841538ebc865a638a843baba104aa015d6c49f3125a8c999ab2c103ff3cfd08b07c3e53a508d17bde2f78e2129b2a4138d25e677677c752177ba635cdb63cf11e18a3c06f752b057f2d4e7f3140274c7b3f55283f9a682601c175c831e4f7c807d2e2c0dffaa035e8ebbf3fd27ac84161f1002e371cdb5d3205ee9263cad899b6b28d509f2b9515c4c442eaf55714742814ab0a7ed68a221cb954e4ea2c3dcd352c0744230cfe9c51a52902debfa78c611bc2cf0154a910ff57281a4b8a39587bb2dc13b75c5d98c9bf7014fb144500950cf629beffb12b677ea4ed718032608e3f7916c316cd6a8b861ad6316f5e04c68726afe2ab1f7aaed8a898726adaa8df362e6a3970d9291df034fc08794ad6a9adc7995202846374bcbf50f3d624b66c89a2362872c324e1e481b1289e73d12248156d1d342cecef4be18cf32733a91b74a1d21e9797d423d527c28bea9da7826b7c0e01e34c2e689b8b20bca12a103edc83116483b03c860420d50f030763e63752ecf4bbe9e1a25dddcc5f4d8a89033d24d28494878319b660d143f75505d13',0,NULL);
INSERT INTO "users" VALUES(2,'2025-11-10T15:34:21.864Z','2025-11-10T15:34:21.864Z','enri@comparepower.com',NULL,NULL,'3f25f039b4d567b907417edf73dad04722a7543b41b2cc042b17c14da91c5b54','303d04b3f04c561923c32e25df792dc87413173d265fc4619775127fb17b98733e75d4c5531e30da8f74cb765efa477079ab05432b4257c776938a483805eebf6cab0c1802309f2d0f38e65c39af5ac9cf1450d3fd1a1384ec6655827ab0868fa655b88b214f3ac81757738c5793da82540a370fb3a0ca7792eaeea1484a76116f10fdaa3764a195adc6f648393abec498ab46327dffeb1757c45129997fe611c7f3cb34ccdeaef2699363513d67cb368063c4d3d763038216498ff783a43d15cd27beea786796adbc170046c7d0566a6e2c9dd2bf228bf4474298199d331965a41851d600784f29061fef32aabe5981c07b238c2ec04390f26a6f9e778a2f72ceb16da971b52963f242d7607dd2e0ecd43f97dd6d45c238cd01cbfbb275733ad9fe00d9cf3704f3d804a2af7465e90a70c67d51dbf4371200667f6024ed90a1acf3a4b9339198ae10cbf37aa74a0256f655664371e1340cfd6c816912428eb7a9a0cc5f9021d9186ac3411ca3aa989f68e75789acdf6e7e076ad5c3e38a262c2ca54061b84bb8b3abcc7285369f5a482b853869dda728e1eee7d2dfeede6b949156eaaf82e85e55dd4bb944888904b8ee443c9e5a0b8e0a260e395dc5c831933396d74e270460dd256c1831d79704f1bc18c5b8b8b528d38cad40435f87d6de71ad9a454a697189f9ee17bc3a38c121453f7c21b3a0d26c4cc9f2f7fec7f1f5',0,NULL);
CREATE TABLE `media` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`alt` text NOT NULL,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`url` text,
  	`thumbnail_u_r_l` text,
  	`filename` text,
  	`mime_type` text,
  	`filesize` numeric,
  	`width` numeric,
  	`height` numeric
  );
INSERT INTO "media" VALUES(1,'Brad Gregory''s profile picture','2025-11-10T15:33:56.141Z','2025-11-10T15:33:56.141Z',NULL,NULL,'brad-gregory.jpg','image/jpeg',37012,600,800);
INSERT INTO "media" VALUES(2,'Enri Zhulati''s profile picture','2025-11-10T15:34:40.875Z','2025-11-10T15:34:40.875Z',NULL,NULL,'enri-zhulati.jpg','image/jpeg',31249,600,800);
CREATE TABLE `payload_locked_documents` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`global_slug` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
CREATE TABLE `payload_locked_documents_rels` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`order` integer,
  	`parent_id` integer NOT NULL,
  	`path` text NOT NULL,
  	`users_id` integer,
  	`media_id` integer,
  	FOREIGN KEY (`parent_id`) REFERENCES `payload_locked_documents`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
  );
CREATE TABLE `payload_preferences` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`key` text,
  	`value` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
INSERT INTO "payload_preferences" VALUES(1,'collection-media','{"editViewType":"default","limit":10}','2025-11-10T15:35:05.691Z','2025-11-10T15:33:39.451Z');
INSERT INTO "payload_preferences" VALUES(2,'collection-users','{"editViewType":"default","limit":10}','2025-11-10T16:15:01.405Z','2025-11-10T15:34:00.969Z');
CREATE TABLE `payload_preferences_rels` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`order` integer,
  	`parent_id` integer NOT NULL,
  	`path` text NOT NULL,
  	`users_id` integer,
  	FOREIGN KEY (`parent_id`) REFERENCES `payload_preferences`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
  );
INSERT INTO "payload_preferences_rels" VALUES(3,NULL,1,'user',1);
INSERT INTO "payload_preferences_rels" VALUES(4,NULL,2,'user',1);
CREATE TABLE `payload_migrations` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`name` text,
  	`batch` numeric,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
INSERT INTO "payload_migrations" VALUES(1,'dev',-1,'2025-11-10 18:22:58','2025-11-10T15:33:08.241Z');
ANALYZE sqlite_schema;
INSERT INTO "sqlite_stat1" VALUES('payload_migrations','payload_migrations_created_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_migrations','payload_migrations_updated_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('_cf_KV','_cf_KV','1 1');
INSERT INTO "sqlite_stat1" VALUES('users','users_email_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('users','users_created_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('users','users_updated_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('media','media_filename_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('media','media_created_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('media','media_updated_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences','payload_preferences_created_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences','payload_preferences_updated_at_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences','payload_preferences_key_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('users_sessions','users_sessions_parent_id_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('users_sessions','users_sessions_order_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('users_sessions','sqlite_autoindex_users_sessions_1','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences_rels','payload_preferences_rels_users_id_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences_rels','payload_preferences_rels_path_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences_rels','payload_preferences_rels_parent_idx','1 1');
INSERT INTO "sqlite_stat1" VALUES('payload_preferences_rels','payload_preferences_rels_order_idx','1 1');
CREATE INDEX `users_sessions_order_idx` ON `users_sessions` (`_order`);
CREATE INDEX `users_sessions_parent_id_idx` ON `users_sessions` (`_parent_id`);
CREATE INDEX `users_updated_at_idx` ON `users` (`updated_at`);
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);
CREATE INDEX `media_updated_at_idx` ON `media` (`updated_at`);
CREATE INDEX `media_created_at_idx` ON `media` (`created_at`);
CREATE UNIQUE INDEX `media_filename_idx` ON `media` (`filename`);
CREATE INDEX `payload_locked_documents_global_slug_idx` ON `payload_locked_documents` (`global_slug`);
CREATE INDEX `payload_locked_documents_updated_at_idx` ON `payload_locked_documents` (`updated_at`);
CREATE INDEX `payload_locked_documents_created_at_idx` ON `payload_locked_documents` (`created_at`);
CREATE INDEX `payload_locked_documents_rels_order_idx` ON `payload_locked_documents_rels` (`order`);
CREATE INDEX `payload_locked_documents_rels_parent_idx` ON `payload_locked_documents_rels` (`parent_id`);
CREATE INDEX `payload_locked_documents_rels_path_idx` ON `payload_locked_documents_rels` (`path`);
CREATE INDEX `payload_locked_documents_rels_users_id_idx` ON `payload_locked_documents_rels` (`users_id`);
CREATE INDEX `payload_locked_documents_rels_media_id_idx` ON `payload_locked_documents_rels` (`media_id`);
CREATE INDEX `payload_preferences_key_idx` ON `payload_preferences` (`key`);
CREATE INDEX `payload_preferences_updated_at_idx` ON `payload_preferences` (`updated_at`);
CREATE INDEX `payload_preferences_created_at_idx` ON `payload_preferences` (`created_at`);
CREATE INDEX `payload_preferences_rels_order_idx` ON `payload_preferences_rels` (`order`);
CREATE INDEX `payload_preferences_rels_parent_idx` ON `payload_preferences_rels` (`parent_id`);
CREATE INDEX `payload_preferences_rels_path_idx` ON `payload_preferences_rels` (`path`);
CREATE INDEX `payload_preferences_rels_users_id_idx` ON `payload_preferences_rels` (`users_id`);
CREATE INDEX `payload_migrations_updated_at_idx` ON `payload_migrations` (`updated_at`);
CREATE INDEX `payload_migrations_created_at_idx` ON `payload_migrations` (`created_at`);

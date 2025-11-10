import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`electricity_rates_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`electricity_rates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_rich_text_order_idx\` ON \`electricity_rates_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_rich_text_parent_id_idx\` ON \`electricity_rates_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_rich_text_path_idx\` ON \`electricity_rates_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`electricity_rates_blocks_asset_manager\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`asset_id\` text,
  	\`alt\` text,
  	\`caption\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`electricity_rates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_asset_manager_order_idx\` ON \`electricity_rates_blocks_asset_manager\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_asset_manager_parent_id_idx\` ON \`electricity_rates_blocks_asset_manager\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_asset_manager_path_idx\` ON \`electricity_rates_blocks_asset_manager\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`electricity_rates_blocks_rates_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`state\` text,
  	\`city\` text,
  	\`show_utility\` text,
  	\`show_provider\` text,
  	\`provider\` text,
  	\`utility\` text,
  	\`exclude_providers\` text,
  	\`link_plan_to_popup\` text,
  	\`text_rr_table\` text,
  	\`append_table_extras\` text,
  	\`pricing_based_on\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`electricity_rates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_rates_table_order_idx\` ON \`electricity_rates_blocks_rates_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_rates_table_parent_id_idx\` ON \`electricity_rates_blocks_rates_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_rates_table_path_idx\` ON \`electricity_rates_blocks_rates_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`electricity_rates_blocks_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_id\` text,
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`electricity_rates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_section_order_idx\` ON \`electricity_rates_blocks_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_section_parent_id_idx\` ON \`electricity_rates_blocks_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_blocks_section_path_idx\` ON \`electricity_rates_blocks_section\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`electricity_rates\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`status\` text DEFAULT 'draft',
  	\`city_name\` text,
  	\`city_ref\` text,
  	\`wordpress_slug\` text,
  	\`wp_post_id\` numeric,
  	\`wp_author\` text,
  	\`published_at\` text,
  	\`updated_date\` text,
  	\`seo_title\` text,
  	\`seo_meta_description\` text,
  	\`hero_heading_line1\` text,
  	\`hero_heading_line2\` text,
  	\`hero_cta_text\` text,
  	\`target_keyword\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`electricity_rates_slug_idx\` ON \`electricity_rates\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_city_name_idx\` ON \`electricity_rates\` (\`city_name\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_updated_at_idx\` ON \`electricity_rates\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates_created_at_idx\` ON \`electricity_rates\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`electricity_rates__status_idx\` ON \`electricity_rates\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_electricity_rates_v_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_electricity_rates_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_rich_text_order_idx\` ON \`_electricity_rates_v_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_rich_text_parent_id_idx\` ON \`_electricity_rates_v_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_rich_text_path_idx\` ON \`_electricity_rates_v_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_electricity_rates_v_blocks_asset_manager\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`asset_id\` text,
  	\`alt\` text,
  	\`caption\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_electricity_rates_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_asset_manager_order_idx\` ON \`_electricity_rates_v_blocks_asset_manager\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_asset_manager_parent_id_idx\` ON \`_electricity_rates_v_blocks_asset_manager\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_asset_manager_path_idx\` ON \`_electricity_rates_v_blocks_asset_manager\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_electricity_rates_v_blocks_rates_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`state\` text,
  	\`city\` text,
  	\`show_utility\` text,
  	\`show_provider\` text,
  	\`provider\` text,
  	\`utility\` text,
  	\`exclude_providers\` text,
  	\`link_plan_to_popup\` text,
  	\`text_rr_table\` text,
  	\`append_table_extras\` text,
  	\`pricing_based_on\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_electricity_rates_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_rates_table_order_idx\` ON \`_electricity_rates_v_blocks_rates_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_rates_table_parent_id_idx\` ON \`_electricity_rates_v_blocks_rates_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_rates_table_path_idx\` ON \`_electricity_rates_v_blocks_rates_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_electricity_rates_v_blocks_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_id\` text,
  	\`content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_electricity_rates_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_section_order_idx\` ON \`_electricity_rates_v_blocks_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_section_parent_id_idx\` ON \`_electricity_rates_v_blocks_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_blocks_section_path_idx\` ON \`_electricity_rates_v_blocks_section\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_electricity_rates_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_status\` text DEFAULT 'draft',
  	\`version_city_name\` text,
  	\`version_city_ref\` text,
  	\`version_wordpress_slug\` text,
  	\`version_wp_post_id\` numeric,
  	\`version_wp_author\` text,
  	\`version_published_at\` text,
  	\`version_updated_date\` text,
  	\`version_seo_title\` text,
  	\`version_seo_meta_description\` text,
  	\`version_hero_heading_line1\` text,
  	\`version_hero_heading_line2\` text,
  	\`version_hero_cta_text\` text,
  	\`version_target_keyword\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`electricity_rates\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_parent_idx\` ON \`_electricity_rates_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_version_version_slug_idx\` ON \`_electricity_rates_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_version_version_city_name_idx\` ON \`_electricity_rates_v\` (\`version_city_name\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_version_version_updated_at_idx\` ON \`_electricity_rates_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_version_version_created_at_idx\` ON \`_electricity_rates_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_version_version__status_idx\` ON \`_electricity_rates_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_created_at_idx\` ON \`_electricity_rates_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_updated_at_idx\` ON \`_electricity_rates_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_electricity_rates_v_latest_idx\` ON \`_electricity_rates_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`electricity_rates_id\` integer REFERENCES electricity_rates(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_electricity_rates_id_idx\` ON \`payload_locked_documents_rels\` (\`electricity_rates_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`electricity_rates_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`electricity_rates_blocks_asset_manager\`;`)
  await db.run(sql`DROP TABLE \`electricity_rates_blocks_rates_table\`;`)
  await db.run(sql`DROP TABLE \`electricity_rates_blocks_section\`;`)
  await db.run(sql`DROP TABLE \`electricity_rates\`;`)
  await db.run(sql`DROP TABLE \`_electricity_rates_v_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`_electricity_rates_v_blocks_asset_manager\`;`)
  await db.run(sql`DROP TABLE \`_electricity_rates_v_blocks_rates_table\`;`)
  await db.run(sql`DROP TABLE \`_electricity_rates_v_blocks_section\`;`)
  await db.run(sql`DROP TABLE \`_electricity_rates_v\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
}

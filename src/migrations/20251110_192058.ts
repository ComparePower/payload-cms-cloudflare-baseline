import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`testimonials\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`testimonial_id\` text NOT NULL,
  	\`customer_name\` text NOT NULL,
  	\`location\` text NOT NULL,
  	\`testimonial_text\` text NOT NULL,
  	\`date\` text NOT NULL,
  	\`category\` text NOT NULL,
  	\`featured\` integer DEFAULT false,
  	\`rating\` numeric,
  	\`avatar_asset_id\` text,
  	\`savings_data_savings_amount\` numeric,
  	\`savings_data_annual_savings\` numeric,
  	\`savings_data_previous_bill_amount\` numeric,
  	\`savings_data_current_bill_amount\` numeric,
  	\`live_link_data_prediction_accuracy\` numeric,
  	\`live_link_data_time_saved\` numeric,
  	\`brand_switcher_data_previous_provider\` text,
  	\`brand_switcher_data_new_provider\` text,
  	\`brand_switcher_data_years_with_previous_provider\` numeric,
  	\`mover_estimator_data_moved_to\` text,
  	\`mover_estimator_data_moved_from\` text,
  	\`mover_estimator_data_estimator_accuracy\` numeric,
  	\`mover_estimator_data_helped_choose_right_plan\` integer DEFAULT true,
  	\`mover_estimator_data_estimated_bill_amount\` numeric,
  	\`mover_urgent_data_activation_time\` text,
  	\`mover_urgent_data_same_day_service\` integer DEFAULT false,
  	\`mover_urgent_data_move_in_date\` text,
  	\`mover_urgent_data_service_start_date\` text,
  	\`no_deposit_data_benefit_type\` text,
  	\`no_deposit_data_deposit_saved\` numeric,
  	\`no_deposit_data_had_credit_concerns\` integer DEFAULT false,
  	\`no_deposit_data_facing_disconnection\` integer DEFAULT false,
  	\`status\` text DEFAULT 'published' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`testimonials_testimonial_id_idx\` ON \`testimonials\` (\`testimonial_id\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_category_idx\` ON \`testimonials\` (\`category\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_featured_idx\` ON \`testimonials\` (\`featured\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_updated_at_idx\` ON \`testimonials\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_created_at_idx\` ON \`testimonials\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`testimonials_id\` integer REFERENCES testimonials(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`testimonials\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`electricity_rates_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`electricity_rates_id\`) REFERENCES \`electricity_rates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "electricity_rates_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "electricity_rates_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_electricity_rates_id_idx\` ON \`payload_locked_documents_rels\` (\`electricity_rates_id\`);`)
}

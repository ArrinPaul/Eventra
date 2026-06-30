CREATE TABLE "ai_recommendation_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cache_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tags" (
	"event_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "event_tags_event_id_tag_id_pk" PRIMARY KEY("event_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "event_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by" text NOT NULL,
	"send_to_all" boolean DEFAULT true NOT NULL,
	"send_email" boolean DEFAULT true NOT NULL,
	"email_stats" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"overall_satisfaction" integer NOT NULL,
	"content_quality" integer NOT NULL,
	"organization_rating" integer NOT NULL,
	"venue_rating" integer,
	"recommendation_score" integer NOT NULL,
	"liked_most" text,
	"improvements" text,
	"additional_comments" text,
	"custom_answers" jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"category" text NOT NULL,
	"last_scraped_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_sources_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"event_title" text NOT NULL,
	"reported_by" text NOT NULL,
	"reporter_name" text NOT NULL,
	"reporter_email" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"attachments" text[],
	"status" text DEFAULT 'open' NOT NULL,
	"organizer" text NOT NULL,
	"organizer_email" text NOT NULL,
	"admin_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" text NOT NULL,
	"content" text NOT NULL,
	"column" text NOT NULL,
	"priority" text NOT NULL,
	"estimated_duration" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"subtasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"event_id" uuid NOT NULL,
	"organizer_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" text NOT NULL,
	"total_tickets" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"user_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"scope" text NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organizer_id" text NOT NULL,
	"prepared_by" text,
	"key_highlights" text[],
	"major_outcomes" text[],
	"budget" numeric(10, 2),
	"sponsorship" numeric(10, 2),
	"actual_expenditure" numeric(10, 2),
	"generated_content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"notes" text,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"attendance_status" text DEFAULT 'registered' NOT NULL,
	"user_id" text,
	"additional_info" jsonb,
	"certificate_generated" boolean DEFAULT false NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"imported_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source_type" text DEFAULT 'native' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source_platform" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "entry_code" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "verified_by" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "ai_recommendation_cache" ADD CONSTRAINT "ai_recommendation_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_updates" ADD CONSTRAINT "event_updates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_updates" ADD CONSTRAINT "event_updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_organizer_users_id_fk" FOREIGN KEY ("organizer") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_leads" ADD CONSTRAINT "sponsor_leads_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_leads" ADD CONSTRAINT "sponsor_leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_recommendation_cache_user_idx" ON "ai_recommendation_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_recommendation_cache_key_idx" ON "ai_recommendation_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_recommendation_cache_user_key" ON "ai_recommendation_cache" USING btree ("user_id","cache_key");--> statement-breakpoint
CREATE INDEX "event_tags_event_idx" ON "event_tags" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_tags_tag_idx" ON "event_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "event_updates_event_idx" ON "event_updates" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_updates_status_idx" ON "event_updates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_updates_created_by_idx" ON "event_updates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "feedback_responses_event_idx" ON "feedback_responses" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "feedback_responses_user_idx" ON "feedback_responses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_responses_event_user_idx" ON "feedback_responses" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "issues_event_idx" ON "issues" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "issues_status_idx" ON "issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "issues_severity_idx" ON "issues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "issues_reported_by_idx" ON "issues" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "kanban_tasks_event_idx" ON "kanban_tasks" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "kanban_tasks_organizer_idx" ON "kanban_tasks" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "orders_event_idx" ON "orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_payment_id_idx" ON "orders" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "rate_limits_identifier_idx" ON "rate_limits" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "rate_limits_scope_idx" ON "rate_limits" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "rate_limits_window_idx" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_identifier_scope_window_idx" ON "rate_limits" USING btree ("identifier","scope","window_start");--> statement-breakpoint
CREATE INDEX "reports_event_idx" ON "reports" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "reports_organizer_idx" ON "reports" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "sponsor_leads_sponsor_idx" ON "sponsor_leads" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "sponsor_leads_user_idx" ON "sponsor_leads" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sponsor_leads_unique_idx" ON "sponsor_leads" USING btree ("sponsor_id","user_id");--> statement-breakpoint
CREATE INDEX "stakeholders_event_idx" ON "stakeholders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "stakeholders_email_idx" ON "stakeholders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "stakeholders_role_idx" ON "stakeholders" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "stakeholders_event_email_idx" ON "stakeholders" USING btree ("event_id","email");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "event_feedback_user_event_idx" ON "event_feedback" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_external_id_idx" ON "events" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "tickets_entry_code_idx" ON "tickets" USING btree ("entry_code");--> statement-breakpoint
CREATE INDEX "tickets_entry_code_event_idx" ON "tickets" USING btree ("entry_code","event_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_slug_unique" UNIQUE("slug");
ALTER TABLE "answers" ALTER COLUMN "answered_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "responses" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "responses" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "responses" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;
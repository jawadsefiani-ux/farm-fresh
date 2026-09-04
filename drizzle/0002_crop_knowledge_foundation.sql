CREATE TABLE IF NOT EXISTS "crop_catalog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "crop_name" text NOT NULL, "variety" text, "crop_family" text,
  "annual_or_perennial" text, "propagation_method" text,
  "direct_sow_allowed" boolean, "transplant_allowed" boolean,
  "sowing_months" integer[], "transplant_months" integer[],
  "germination_days_min" integer, "germination_days_max" integer,
  "days_to_harvest_min" integer, "days_to_harvest_max" integer,
  "watering_level" text, "watering_notes" text,
  "rotation_years" integer, "rotation_notes" text, "spacing_notes" text,
  "maintenance_notes" text, "harvest_notes" text, "notes" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crop_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "crop_catalog_id" uuid NOT NULL REFERENCES "crop_catalog"("id") ON DELETE cascade,
  "stage_name" text NOT NULL, "sort_order" integer NOT NULL,
  "start_day_estimate" integer, "end_day_estimate" integer,
  "expected_observation" text, "recommended_action" text, "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seed_inventory" ADD COLUMN IF NOT EXISTS "crop_catalog_id" uuid REFERENCES "crop_catalog"("id") ON DELETE set null;
ALTER TABLE "plantings" ADD COLUMN IF NOT EXISTS "crop_catalog_id" uuid REFERENCES "crop_catalog"("id") ON DELETE set null;
CREATE INDEX IF NOT EXISTS "crop_stages_catalog_sort_idx" ON "crop_stages" ("crop_catalog_id", "sort_order");
--> statement-breakpoint
DROP TRIGGER IF EXISTS crop_catalog_updated_at ON "crop_catalog";
DROP TRIGGER IF EXISTS crop_stages_updated_at ON "crop_stages";
CREATE TRIGGER crop_catalog_updated_at BEFORE UPDATE ON "crop_catalog" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER crop_stages_updated_at BEFORE UPDATE ON "crop_stages" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
INSERT INTO "crop_catalog" ("crop_name", "variety", "crop_family")
SELECT v.crop_name, v.variety, v.crop_family FROM (VALUES
('Tomato', 'Cœur de Bœuf', 'Solanaceae'), ('Cherry Tomato', 'Yellow', 'Solanaceae'), ('Onion', NULL, 'Amaryllidaceae'), ('Fava Bean', NULL, 'Fabaceae'), ('Spaghetti Squash', NULL, 'Cucurbitaceae'), ('Pumpkin', NULL, 'Cucurbitaceae'), ('Courgette', 'Grise', 'Cucurbitaceae'), ('Courgette', 'Verte', 'Cucurbitaceae'), ('Potato', NULL, 'Solanaceae')
) AS v(crop_name, variety, crop_family)
WHERE NOT EXISTS (SELECT 1 FROM "crop_catalog" c WHERE c.crop_name = v.crop_name AND c.variety IS NOT DISTINCT FROM v.variety);
--> statement-breakpoint
UPDATE "seed_inventory" s SET "crop_catalog_id" = c.id FROM "crop_catalog" c WHERE s.crop_catalog_id IS NULL AND s.crop_name = c.crop_name AND s.variety IS NOT DISTINCT FROM c.variety;
UPDATE "plantings" p SET "crop_catalog_id" = c.id FROM "crop_catalog" c WHERE p.crop_catalog_id IS NULL AND p.crop_name = c.crop_name AND p.variety IS NOT DISTINCT FROM c.variety;

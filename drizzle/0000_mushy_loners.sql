CREATE TABLE "farm_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"zone_type" text DEFAULT 'planting' NOT NULL,
	"width_m" numeric(8, 2) NOT NULL,
	"length_m" numeric(8, 2) NOT NULL,
	"area_m2" numeric(10, 2) GENERATED ALWAYS AS ("width_m" * "length_m") STORED,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farm_zones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"crop_name" text NOT NULL,
	"variety" text,
	"crop_family" text,
	"planting_date" date,
	"planting_date_precision" text DEFAULT 'unknown' NOT NULL,
	"planting_method" text DEFAULT 'unknown' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"area_used_percent" numeric(5, 2),
	"expected_harvest_start" date,
	"expected_harvest_end" date,
	"actual_harvest_date" date,
	"perennial" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_name" text NOT NULL,
	"variety" text,
	"crop_family" text,
	"quantity" numeric(10, 2),
	"quantity_unit" text,
	"stock_status" text DEFAULT 'in_stock' NOT NULL,
	"acquired_date" date,
	"packet_expiry_date" date,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_zone_id_farm_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."farm_zones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plantings_zone_id_idx" ON "plantings" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "plantings_status_idx" ON "plantings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seed_inventory_stock_status_idx" ON "seed_inventory" USING btree ("stock_status");
--> statement-breakpoint
ALTER TABLE "seed_inventory" ADD CONSTRAINT "seed_inventory_stock_status_check" CHECK ("stock_status" IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued'));
--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_date_precision_check" CHECK ("planting_date_precision" IN ('exact', 'approximate', 'unknown'));
--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_method_check" CHECK ("planting_method" IN ('direct_seed', 'transplanted', 'existing', 'unknown'));
--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_status_check" CHECK ("status" IN ('planned', 'seeded', 'transplanted', 'growing', 'ready_to_harvest', 'harvesting', 'finished', 'removed'));
--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_area_used_percent_check" CHECK ("area_used_percent" IS NULL OR ("area_used_percent" >= 0 AND "area_used_percent" <= 100));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
--> statement-breakpoint
CREATE TRIGGER farm_zones_updated_at BEFORE UPDATE ON "farm_zones" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER seed_inventory_updated_at BEFORE UPDATE ON "seed_inventory" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER plantings_updated_at BEFORE UPDATE ON "plantings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
INSERT INTO "farm_zones" ("code", "name", "width_m", "length_m") VALUES
('RB1', 'Raised Bed 1', 3, 3), ('RB2', 'Raised Bed 2', 3, 3), ('RB3', 'Raised Bed 3', 3, 3), ('RB4', 'Raised Bed 4', 3, 3),
('NB1', 'Narrow Bed 1', 1, 3), ('NB2', 'Narrow Bed 2', 1, 3), ('NB3', 'Narrow Bed 3', 1, 3), ('NB4', 'Narrow Bed 4', 1, 3), ('NB5', 'Narrow Bed 5', 1, 3), ('NB6', 'Narrow Bed 6', 1, 3), ('NB7', 'Narrow Bed 7', 1, 3), ('NB8', 'Narrow Bed 8', 1, 3),
('FR1', 'Front Right 1', 5, 3), ('FR2', 'Front Right 2', 5, 3), ('FR3', 'Front Right 3', 5, 3), ('FR4', 'Front Right 4', 5, 3), ('FR5', 'Front Right 5', 5, 3), ('FR6', 'Front Right 6', 5, 3), ('FR7', 'Front Right 7', 5, 3), ('FR8', 'Front Right 8', 5, 3), ('FR9', 'Front Right 9', 5, 3), ('FR10', 'Front Right 10', 8, 3),
('FL1', 'Front Left 1', 8, 3), ('FL2', 'Front Left 2', 5, 3), ('FL3', 'Front Left 3', 5, 3), ('FL4', 'Front Left 4', 5, 3), ('FL5', 'Front Left 5', 5, 3), ('FL6', 'Front Left 6', 5, 3), ('FL7', 'Front Left 7', 5, 3), ('FL8', 'Front Left 8', 5, 3), ('FL9', 'Front Left 9', 5, 3), ('FL10', 'Front Left 10', 5, 3),
('MF1', 'Main Field', 22, 11)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "seed_inventory" ("crop_name", "variety", "crop_family")
SELECT v.crop_name, v.variety, v.crop_family FROM (VALUES
('Tomato', 'Cœur de Bœuf', 'Solanaceae'), ('Cherry Tomato', 'Yellow', 'Solanaceae'), ('Onion', NULL, 'Amaryllidaceae'), ('Fava Bean', NULL, 'Fabaceae'), ('Spaghetti Squash', NULL, 'Cucurbitaceae'), ('Pumpkin', NULL, 'Cucurbitaceae'), ('Courgette', 'Grise', 'Cucurbitaceae'), ('Courgette', 'Verte', 'Cucurbitaceae'), ('Potato', NULL, 'Solanaceae')
) AS v(crop_name, variety, crop_family)
WHERE NOT EXISTS (SELECT 1 FROM "seed_inventory" s WHERE s.crop_name = v.crop_name AND s.variety IS NOT DISTINCT FROM v.variety);

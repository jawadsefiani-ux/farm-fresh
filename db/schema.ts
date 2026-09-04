import { sql } from "drizzle-orm";
import { boolean, date, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const farmZones = pgTable("farm_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  zoneType: text("zone_type").notNull().default("planting"),
  widthM: numeric("width_m", { precision: 8, scale: 2 }).notNull(),
  lengthM: numeric("length_m", { precision: 8, scale: 2 }).notNull(),
  areaM2: numeric("area_m2", { precision: 10, scale: 2 }).generatedAlwaysAs(() => sql`"width_m" * "length_m"`),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const seedInventory = pgTable("seed_inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  cropFamily: text("crop_family"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  quantityUnit: text("quantity_unit"),
  stockStatus: text("stock_status").notNull().default("in_stock"),
  acquiredDate: date("acquired_date"),
  packetExpiryDate: date("packet_expiry_date"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  cropCatalogId: uuid("crop_catalog_id").references(() => cropCatalog.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("seed_inventory_stock_status_idx").on(table.stockStatus)]);

export const cropCatalog = pgTable("crop_catalog", {
  id: uuid("id").defaultRandom().primaryKey(), cropName: text("crop_name").notNull(), variety: text("variety"), cropFamily: text("crop_family"), annualOrPerennial: text("annual_or_perennial"), propagationMethod: text("propagation_method"), directSowAllowed: boolean("direct_sow_allowed"), transplantAllowed: boolean("transplant_allowed"), sowingMonths: integer("sowing_months").array(), transplantMonths: integer("transplant_months").array(), germinationDaysMin: integer("germination_days_min"), germinationDaysMax: integer("germination_days_max"), daysToHarvestMin: integer("days_to_harvest_min"), daysToHarvestMax: integer("days_to_harvest_max"), wateringLevel: text("watering_level"), wateringNotes: text("watering_notes"), rotationYears: integer("rotation_years"), rotationNotes: text("rotation_notes"), spacingNotes: text("spacing_notes"), maintenanceNotes: text("maintenance_notes"), harvestNotes: text("harvest_notes"), notes: text("notes"), active: boolean("active").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cropStages = pgTable("crop_stages", {
  id: uuid("id").defaultRandom().primaryKey(), cropCatalogId: uuid("crop_catalog_id").notNull().references(() => cropCatalog.id, { onDelete: "cascade" }), stageName: text("stage_name").notNull(), sortOrder: integer("sort_order").notNull(), startDayEstimate: integer("start_day_estimate"), endDayEstimate: integer("end_day_estimate"), expectedObservation: text("expected_observation"), recommendedAction: text("recommended_action"), notes: text("notes"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("crop_stages_catalog_sort_idx").on(table.cropCatalogId, table.sortOrder)]);

export const farmTasks = pgTable("farm_tasks", {
  id: uuid("id").defaultRandom().primaryKey(), plantingId: uuid("planting_id").references(() => plantings.id, { onDelete: "set null" }), zoneId: uuid("zone_id").references(() => farmZones.id, { onDelete: "set null" }), taskType: text("task_type").notNull(), title: text("title").notNull(), description: text("description").notNull(), priority: text("priority").notNull().default("normal"), dueDate: date("due_date"), source: text("source").notNull().default("generated"), fingerprint: text("fingerprint").notNull().unique(), status: text("status").notNull().default("pending"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [index("farm_tasks_status_idx").on(table.status)]);

export const plantings = pgTable("plantings", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull().references(() => farmZones.id, { onDelete: "restrict" }),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  cropFamily: text("crop_family"),
  cropCatalogId: uuid("crop_catalog_id").references(() => cropCatalog.id, { onDelete: "set null" }),
  plantingDate: date("planting_date"),
  plantingDatePrecision: text("planting_date_precision").notNull().default("unknown"),
  plantingMethod: text("planting_method").notNull().default("unknown"),
  status: text("status").notNull().default("planned"),
  areaUsedPercent: numeric("area_used_percent", { precision: 5, scale: 2 }),
  expectedHarvestStart: date("expected_harvest_start"),
  expectedHarvestEnd: date("expected_harvest_end"),
  actualHarvestDate: date("actual_harvest_date"),
  perennial: boolean("perennial").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("plantings_zone_id_idx").on(table.zoneId), index("plantings_status_idx").on(table.status)]);

import { sql } from "drizzle-orm";
import { boolean, date, index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("seed_inventory_stock_status_idx").on(table.stockStatus)]);

export const plantings = pgTable("plantings", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull().references(() => farmZones.id, { onDelete: "restrict" }),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  cropFamily: text("crop_family"),
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

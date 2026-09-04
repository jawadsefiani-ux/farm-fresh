import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { farmZones, plantings, seedInventory } from "@/db/schema";

export const runtime = "nodejs";

const seedStatuses = ["in_stock", "low_stock", "out_of_stock", "discontinued"] as const;
const plantingStatuses = ["planned", "seeded", "transplanted", "growing", "ready_to_harvest", "harvesting", "finished", "removed"] as const;
const plantingMethods = ["direct_seed", "transplanted", "existing", "unknown"] as const;
const datePrecisions = ["exact", "approximate", "unknown"] as const;

const optionalText = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const dateValue = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
const inList = <T extends readonly string[]>(value: unknown, values: T): value is T[number] => typeof value === "string" && values.includes(value);
const areaPercent = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 100 ? String(parsed) : undefined;
};

export async function GET() {
  const [zones, seeds, records] = await Promise.all([
    db.select().from(farmZones).orderBy(asc(farmZones.createdAt)),
    db.select().from(seedInventory).orderBy(asc(seedInventory.createdAt)),
    db.select({
      id: plantings.id, cropName: plantings.cropName, variety: plantings.variety, cropFamily: plantings.cropFamily,
      plantingDate: plantings.plantingDate, plantingDatePrecision: plantings.plantingDatePrecision,
      plantingMethod: plantings.plantingMethod, status: plantings.status, perennial: plantings.perennial,
      notes: plantings.notes, areaUsedPercent: plantings.areaUsedPercent, zone: farmZones.code,
    }).from(plantings).innerJoin(farmZones, eq(plantings.zoneId, farmZones.id)).orderBy(desc(plantings.createdAt)),
  ]);
  return Response.json({ zones, seeds, plantings: records });
}

export async function POST(request: Request) {
  const body = await request.json() as { action?: string; data?: Record<string, unknown> };
  const data = body.data ?? {};

  if (body.action === "createSeed") {
    if (!optionalText(data.crop)) return Response.json({ error: "Crop name is required." }, { status: 400 });
    await db.insert(seedInventory).values({ cropName: optionalText(data.crop)!, variety: optionalText(data.variety), cropFamily: optionalText(data.family) });
  } else if (body.action === "updateSeed") {
    if (typeof data.id !== "string" || !optionalText(data.crop) || !inList(data.status, seedStatuses)) return Response.json({ error: "Invalid seed." }, { status: 400 });
    await db.update(seedInventory).set({ cropName: optionalText(data.crop)!, variety: optionalText(data.variety), cropFamily: optionalText(data.family), stockStatus: data.status, active: data.status !== "discontinued", updatedAt: new Date() }).where(eq(seedInventory.id, data.id));
  } else if (body.action === "deleteSeed") {
    if (typeof data.id !== "string") return Response.json({ error: "Invalid seed." }, { status: 400 });
    await db.delete(seedInventory).where(eq(seedInventory.id, data.id));
  } else if (body.action === "createPlanting" || body.action === "updatePlanting") {
    const zone = optionalText(data.zone);
    if (!optionalText(data.crop) || !zone || !inList(data.precision, datePrecisions) || !inList(data.method, plantingMethods) || !inList(data.status, plantingStatuses)) return Response.json({ error: "Invalid planting." }, { status: 400 });
    const areaUsedPercent = areaPercent(data.areaUsedPercent);
    if (areaUsedPercent === undefined) return Response.json({ error: "Area used must be between 1% and 100%." }, { status: 400 });
    const [farmZone] = await db.select({ id: farmZones.id }).from(farmZones).where(and(eq(farmZones.code, zone), eq(farmZones.active, true)));
    if (!farmZone) return Response.json({ error: "Unknown farm zone." }, { status: 400 });
    const values = { zoneId: farmZone.id, cropName: optionalText(data.crop)!, variety: optionalText(data.variety), cropFamily: optionalText(data.family), plantingDate: dateValue(data.date), plantingDatePrecision: data.precision, plantingMethod: data.method, status: data.status, areaUsedPercent, perennial: data.perennial === true, notes: optionalText(data.notes), updatedAt: new Date() };
    if (body.action === "createPlanting") await db.insert(plantings).values(values);
    else if (typeof data.id === "string") await db.update(plantings).set(values).where(eq(plantings.id, data.id));
    else return Response.json({ error: "Invalid planting." }, { status: 400 });
  } else if (body.action === "setPlantingStatus") {
    if (typeof data.id !== "string" || !inList(data.status, plantingStatuses)) return Response.json({ error: "Invalid planting." }, { status: 400 });
    await db.update(plantings).set({ status: data.status, actualHarvestDate: data.status === "finished" ? new Date().toISOString().slice(0, 10) : null, updatedAt: new Date() }).where(eq(plantings.id, data.id));
  } else {
    return Response.json({ error: "Unknown action." }, { status: 400 });
  }

  return GET();
}

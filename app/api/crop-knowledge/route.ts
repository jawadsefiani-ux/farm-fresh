import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cropCatalog, cropStages } from "@/db/schema";

export const runtime = "nodejs";
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const integer = (value: unknown) => value === "" || value === null || value === undefined ? null : Number.isInteger(Number(value)) ? Number(value) : undefined;
const months = (value: unknown) => Array.isArray(value) && value.every((month) => Number.isInteger(month) && month >= 1 && month <= 12) ? value as number[] : null;

export async function GET() {
  const [catalog, stages] = await Promise.all([db.select().from(cropCatalog).orderBy(asc(cropCatalog.cropName), asc(cropCatalog.variety)), db.select().from(cropStages).orderBy(asc(cropStages.sortOrder))]);
  return Response.json({ catalog, stages });
}

export async function POST(request: Request) {
  const { action, data = {} } = await request.json() as { action?: string; data?: Record<string, unknown> };
  if (action === "updateCrop") {
    if (typeof data.id !== "string" || !text(data.cropName)) return Response.json({ error: "Crop name is required." }, { status: 400 });
    const numericFields = ["germinationDaysMin", "germinationDaysMax", "daysToHarvestMin", "daysToHarvestMax", "rotationYears"] as const;
    const numeric = Object.fromEntries(numericFields.map((field) => [field, integer(data[field])]));
    if (Object.values(numeric).some((value) => value === undefined)) return Response.json({ error: "Day ranges and rotation interval must be whole numbers." }, { status: 400 });
    await db.update(cropCatalog).set({ cropName: text(data.cropName)!, variety: text(data.variety), cropFamily: text(data.cropFamily), annualOrPerennial: text(data.annualOrPerennial), propagationMethod: text(data.propagationMethod), directSowAllowed: typeof data.directSowAllowed === "boolean" ? data.directSowAllowed : null, transplantAllowed: typeof data.transplantAllowed === "boolean" ? data.transplantAllowed : null, sowingMonths: months(data.sowingMonths), transplantMonths: months(data.transplantMonths), ...numeric, wateringLevel: text(data.wateringLevel), wateringNotes: text(data.wateringNotes), rotationNotes: text(data.rotationNotes), spacingNotes: text(data.spacingNotes), maintenanceNotes: text(data.maintenanceNotes), harvestNotes: text(data.harvestNotes), notes: text(data.notes), updatedAt: new Date() }).where(eq(cropCatalog.id, data.id));
  } else if (action === "saveStage") {
    const stageValues = { stageName: text(data.stageName), sortOrder: integer(data.sortOrder), startDayEstimate: integer(data.startDayEstimate), endDayEstimate: integer(data.endDayEstimate), expectedObservation: text(data.expectedObservation), recommendedAction: text(data.recommendedAction), notes: text(data.notes), updatedAt: new Date() };
    if (!stageValues.stageName || stageValues.sortOrder === undefined || stageValues.startDayEstimate === undefined || stageValues.endDayEstimate === undefined) return Response.json({ error: "Stage name and numeric estimates are invalid." }, { status: 400 });
    const validStageValues = { ...stageValues, stageName: stageValues.stageName as string, sortOrder: stageValues.sortOrder as number, startDayEstimate: stageValues.startDayEstimate ?? null, endDayEstimate: stageValues.endDayEstimate ?? null };
    if (typeof data.id === "string") await db.update(cropStages).set(validStageValues).where(eq(cropStages.id, data.id));
    else if (typeof data.cropCatalogId === "string") await db.insert(cropStages).values({ ...validStageValues, cropCatalogId: data.cropCatalogId });
    else return Response.json({ error: "A crop is required for a new stage." }, { status: 400 });
  } else return Response.json({ error: "Unknown action." }, { status: 400 });
  return GET();
}

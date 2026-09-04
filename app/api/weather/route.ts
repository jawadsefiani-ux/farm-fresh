import { getFarmWeather } from "@/lib/weather";
export const runtime = "nodejs";
export async function GET() { return Response.json(await getFarmWeather()); }

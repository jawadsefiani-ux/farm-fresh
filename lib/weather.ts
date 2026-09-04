import "server-only";

export type WeatherData = { locationName: string; current: { temperature: number; apparentTemperature: number; weatherCode: number; humidity: number; precipitation: number; windSpeed: number; windGusts: number }; days: Array<{ date: string; weatherCode: number; minTemperature: number; maxTemperature: number; precipitationProbability: number; precipitation: number; windGusts: number; et0: number | null; soilMoisture: number | null }> };
const number = (name: string) => { const value = Number(process.env[name]); return Number.isFinite(value) ? value : null; };

export async function getFarmWeather(): Promise<{ kind: "ready"; data: WeatherData } | { kind: "unconfigured" } | { kind: "unavailable" }> {
  const latitude = number("FARM_LATITUDE"); const longitude = number("FARM_LONGITUDE"); const timezone = process.env.FARM_TIMEZONE ?? "Africa/Casablanca";
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return { kind: "unconfigured" };
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), timezone, forecast_days: "7", current: "temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m", daily: "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,et0_fao_evapotranspiration,soil_moisture_0_to_1cm_mean" }).toString();
    const response = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) }); if (!response.ok) throw new Error("Weather provider unavailable");
    const raw = await response.json() as { current: Record<string, number>; daily: Record<string, Array<number | string | null>> };
    return { kind: "ready", data: { locationName: process.env.FARM_LOCATION_NAME || "Sidi Bettach", current: { temperature: raw.current.temperature_2m, apparentTemperature: raw.current.apparent_temperature, weatherCode: raw.current.weather_code, humidity: raw.current.relative_humidity_2m, precipitation: raw.current.precipitation, windSpeed: raw.current.wind_speed_10m, windGusts: raw.current.wind_gusts_10m }, days: raw.daily.time.map((date, index) => ({ date: String(date), weatherCode: Number(raw.daily.weather_code[index]), minTemperature: Number(raw.daily.temperature_2m_min[index]), maxTemperature: Number(raw.daily.temperature_2m_max[index]), precipitationProbability: Number(raw.daily.precipitation_probability_max[index]), precipitation: Number(raw.daily.precipitation_sum[index]), windGusts: Number(raw.daily.wind_gusts_10m_max[index]), et0: raw.daily.et0_fao_evapotranspiration[index] === null ? null : Number(raw.daily.et0_fao_evapotranspiration[index]), soilMoisture: raw.daily.soil_moisture_0_to_1cm_mean[index] === null ? null : Number(raw.daily.soil_moisture_0_to_1cm_mean[index]) })) } };
  } catch { return { kind: "unavailable" }; }
}

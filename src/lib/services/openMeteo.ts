export type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  precipitation: number;
};

export type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: OpenMeteoCurrent;
};

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "weather_code",
  "precipitation",
].join(",");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Open-Meteo: invalid ${field}`);
  }
  return value;
};

const asString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Open-Meteo: invalid ${field}`);
  }
  return value;
};

const parseCurrent = (value: unknown): OpenMeteoCurrent => {
  if (!isRecord(value)) {
    throw new Error("Open-Meteo: invalid current payload");
  }

  return {
    time: asString(value.time, "current.time"),
    temperature_2m: asNumber(value.temperature_2m, "current.temperature_2m"),
    relative_humidity_2m: asNumber(
      value.relative_humidity_2m,
      "current.relative_humidity_2m"
    ),
    apparent_temperature: asNumber(
      value.apparent_temperature,
      "current.apparent_temperature"
    ),
    surface_pressure: asNumber(
      value.surface_pressure,
      "current.surface_pressure"
    ),
    wind_speed_10m: asNumber(value.wind_speed_10m, "current.wind_speed_10m"),
    wind_direction_10m: asNumber(
      value.wind_direction_10m,
      "current.wind_direction_10m"
    ),
    weather_code: asNumber(value.weather_code, "current.weather_code"),
    precipitation: asNumber(value.precipitation, "current.precipitation"),
  };
};

const parseResponse = (value: unknown): OpenMeteoResponse => {
  if (!isRecord(value)) {
    throw new Error("Open-Meteo: invalid response payload");
  }

  return {
    latitude: asNumber(value.latitude, "latitude"),
    longitude: asNumber(value.longitude, "longitude"),
    timezone: asString(value.timezone, "timezone"),
    current: parseCurrent(value.current),
  };
};

export const fetchCurrentByCoords = async (
  lat: number,
  lon: number,
  tz: string
): Promise<OpenMeteoResponse> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Open-Meteo: invalid coordinates");
  }
  if (!tz) {
    throw new Error("Open-Meteo: timezone required");
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("current", CURRENT_FIELDS);
  url.searchParams.set("timezone", tz);
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed (${response.status})`);
  }

  const data = (await response.json()) as unknown;
  return parseResponse(data);
};

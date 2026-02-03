import type { City } from "../data/cities";
import { assertWeatherCard, type WeatherCard } from "../schemas/weather";

import { fetchCurrentByCoords } from "./openMeteo";

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

const toWindDir = (degrees: number): string => {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS[index];
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Moderate rain showers",
  82: "Intense rain showers",
  85: "Light snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

const weatherCodeLabel = (code: number): string => {
  return WEATHER_CODE_LABELS[code] ?? `Unknown (${code})`;
};

export const getCurrent = async (city: City): Promise<WeatherCard> => {
  const data = await fetchCurrentByCoords(city.lat, city.lon, city.tz);
  const current = data.current;

  const normalized: WeatherCard = {
    tempC: current.temperature_2m,
    humidityPct: current.relative_humidity_2m,
    pressureHpa: current.surface_pressure,
    windKph: current.wind_speed_10m,
    windDir: toWindDir(current.wind_direction_10m),
    condition: weatherCodeLabel(current.weather_code),
    localTime: current.time,
    updatedAt: new Date().toISOString(),
  };

  return assertWeatherCard(normalized);
};

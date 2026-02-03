import type { City } from "../data/cities";
import { assertWeatherCard, type WeatherCard } from "../schemas/weather";

import { fetchCurrentByCoords } from "./openMeteo";

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const toWindDir = (degrees: number): string => {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS[index];
};

const weatherCodeLabel = (code: number): string => {
  switch (code) {
    case 0:
      return "Clear sky";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
      return "Fog";
    case 48:
      return "Rime fog";
    case 51:
      return "Light drizzle";
    case 53:
      return "Moderate drizzle";
    case 55:
      return "Dense drizzle";
    case 56:
      return "Light freezing drizzle";
    case 57:
      return "Dense freezing drizzle";
    case 61:
      return "Light rain";
    case 63:
      return "Moderate rain";
    case 65:
      return "Heavy rain";
    case 66:
      return "Light freezing rain";
    case 67:
      return "Heavy freezing rain";
    case 71:
      return "Light snow";
    case 73:
      return "Moderate snow";
    case 75:
      return "Heavy snow";
    case 77:
      return "Snow grains";
    case 80:
      return "Light rain showers";
    case 81:
      return "Moderate rain showers";
    case 82:
      return "Violent rain showers";
    case 85:
      return "Light snow showers";
    case 86:
      return "Heavy snow showers";
    case 95:
      return "Thunderstorm";
    case 96:
      return "Thunderstorm with hail";
    case 99:
      return "Thunderstorm with heavy hail";
    default:
      return "Unknown";
  }
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

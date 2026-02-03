export type WeatherCard = {
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  windKph: number;
  windDir: string;
  condition: string;
  localTime: string;
  updatedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export const isWeatherCard = (value: unknown): value is WeatherCard => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.tempC) &&
    isFiniteNumber(value.humidityPct) &&
    isFiniteNumber(value.pressureHpa) &&
    isFiniteNumber(value.windKph) &&
    isNonEmptyString(value.windDir) &&
    isNonEmptyString(value.condition) &&
    isNonEmptyString(value.localTime) &&
    isNonEmptyString(value.updatedAt)
  );
};

export const assertWeatherCard = (value: unknown): WeatherCard => {
  if (!isWeatherCard(value)) {
    throw new Error("Invalid weather card payload");
  }
  return value;
};

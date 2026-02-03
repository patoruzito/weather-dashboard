import type { APIRoute } from "astro";

import { MemoryCache } from "../../../../lib/cache";
import { cities } from "../../../../lib/data/cities";
import { fail, ok } from "../../../../lib/http/response";
import type { WeatherCard } from "../../../../lib/schemas/weather";
import { getCurrent } from "../../../../lib/services/weatherService";

const WEATHER_TTL_SECONDS = 120;
const weatherCache = new MemoryCache<WeatherCard>();

const cacheHeaders = (ttlSeconds: number): HeadersInit => {
  const maxAge = Math.max(1, Math.floor(ttlSeconds));
  const staleSeconds = Math.min(30, maxAge);
  return {
    "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleSeconds}`,
  };
};

const noStoreHeaders: HeadersInit = {
  "Cache-Control": "no-store",
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const cityIdRaw = url.searchParams.get("cityId");
  const cityId = cityIdRaw?.trim().toLowerCase();

  if (!cityId) {
    return fail(
      { message: "cityId query parameter is required", code: "CITY_ID_REQUIRED" },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const city = cities.find((item) => item.id === cityId);
  if (!city) {
    return fail(
      { message: "cityId is invalid", code: "CITY_ID_INVALID" },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const cacheKey = `weather:current:${cityId}`;
  const cachedHit = weatherCache.get(cacheKey);
  if (cachedHit) {
    return ok(
      {
        cityId,
        weather: cachedHit.value,
        meta: { cached: true, ttlSeconds: cachedHit.ttlSeconds },
      },
      { headers: cacheHeaders(cachedHit.ttlSeconds) }
    );
  }

  try {
    const weather = await getCurrent(city);
    weatherCache.set(cacheKey, weather, WEATHER_TTL_SECONDS);

    return ok(
      {
        cityId,
        weather,
        meta: { cached: false, ttlSeconds: WEATHER_TTL_SECONDS },
      },
      { headers: cacheHeaders(WEATHER_TTL_SECONDS) }
    );
  } catch (error) {
    console.error("Weather provider error", error);
    return fail(
      { message: "Weather provider unavailable", code: "PROVIDER_FAILED" },
      { status: 502, headers: noStoreHeaders }
    );
  }
};

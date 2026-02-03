type WeatherCard = {
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  windKph: number;
  windDir: string;
  condition: string;
  localTime: string;
  updatedAt: string;
};

type ApiOk = {
  ok: true;
  cityId: string;
  weather: WeatherCard;
  meta: {
    cached: boolean;
    ttlSeconds: number;
  };
};

type ApiFail = {
  ok: false;
  error: {
    message: string;
    code?: string;
  };
};

type CardState = {
  card: HTMLElement;
  index: string;
  storageKey: string;
  select: HTMLSelectElement;
  temp: HTMLElement;
  humidity: HTMLElement;
  pressure: HTMLElement;
  localTime: HTMLElement;
  wind: HTMLElement;
  condition: HTMLElement;
  cacheBadge: HTMLElement;
  updatedBadge: HTMLElement;
  lastUpdatedAt?: number;
  currentCityId?: string;
  inflight?: AbortController;
};

type StatusState = "idle" | "loading" | "live" | "cached" | "error";

const STORAGE_PREFIX = "weather-dashboard:card:";
const REFRESH_INTERVAL_MS = 90_000;
const UPDATED_TICK_MS = 1_000;

const statusLabels: Record<StatusState, string> = {
  idle: "--",
  loading: "Loading",
  live: "Live",
  cached: "Cached",
  error: "Error",
};

const query = <T extends Element>(root: ParentNode, selector: string): T | null =>
  root.querySelector<T>(selector);

const safeStorageGet = (key: string): string => {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};

const safeStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (private mode / blocked storage).
  }
};

const safeStorageRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors (private mode / blocked storage).
  }
};

const formatLocalTime = (value: string): string => {
  if (!value) {
    return "--:--";
  }
  const parts = value.split("T");
  if (parts.length === 2) {
    return parts[1].slice(0, 5);
  }
  return value;
};

const formatNumber = (value: number, unit: string): string =>
  `${Math.round(value)}${unit}`;

const setStatusBadge = (state: CardState, status: StatusState): void => {
  state.cacheBadge.textContent = statusLabels[status];
  state.cacheBadge.classList.remove(
    "is-live",
    "is-cached",
    "is-loading",
    "is-error"
  );
  if (status === "live") {
    state.cacheBadge.classList.add("is-live");
  } else if (status === "cached") {
    state.cacheBadge.classList.add("is-cached");
  } else if (status === "loading") {
    state.cacheBadge.classList.add("is-loading");
  } else if (status === "error") {
    state.cacheBadge.classList.add("is-error");
  }
};

const setUpdatedBadge = (state: CardState, seconds: number | null): void => {
  if (seconds === null || Number.isNaN(seconds)) {
    state.updatedBadge.textContent = "Updated --";
    return;
  }
  state.updatedBadge.textContent = `Updated ${seconds}s ago`;
};

const clearCard = (state: CardState): void => {
  state.temp.textContent = "--°C";
  state.humidity.textContent = "--%";
  state.pressure.textContent = "---- hPa";
  state.localTime.textContent = "--:--";
  state.wind.textContent = "-- km/h";
  state.condition.textContent = "--";
  state.lastUpdatedAt = undefined;
  setStatusBadge(state, "idle");
  setUpdatedBadge(state, null);
};

const updateCard = (state: CardState, payload: ApiOk): void => {
  const { weather, meta } = payload;
  state.temp.textContent = `${Math.round(weather.tempC)}°C`;
  state.humidity.textContent = formatNumber(weather.humidityPct, "%");
  state.pressure.textContent = formatNumber(weather.pressureHpa, " hPa");
  state.localTime.textContent = formatLocalTime(weather.localTime);
  state.wind.textContent = `${Math.round(weather.windKph)} km/h ${weather.windDir}`;
  state.condition.textContent = weather.condition;
  state.lastUpdatedAt = Date.parse(weather.updatedAt);
  const deltaSeconds = Math.max(
    0,
    Math.floor((Date.now() - state.lastUpdatedAt) / 1000)
  );
  setUpdatedBadge(state, deltaSeconds);
  setStatusBadge(state, meta.cached ? "cached" : "live");
};

const updateError = (state: CardState, message?: string): void => {
  state.temp.textContent = "--°C";
  state.humidity.textContent = "--%";
  state.pressure.textContent = "---- hPa";
  state.localTime.textContent = "--:--";
  state.wind.textContent = "-- km/h";
  state.condition.textContent = message ? `Error: ${message}` : "Unavailable";
  state.lastUpdatedAt = undefined;
  setStatusBadge(state, "error");
  setUpdatedBadge(state, null);
};

const fetchWeather = async (state: CardState, cityId: string): Promise<void> => {
  if (!cityId) {
    clearCard(state);
    return;
  }

  if (state.inflight) {
    state.inflight.abort();
  }

  const controller = new AbortController();
  state.inflight = controller;
  state.currentCityId = cityId;

  setStatusBadge(state, "loading");
  setUpdatedBadge(state, null);

  try {
    const response = await fetch(
      `/api/v1/weather/current?cityId=${encodeURIComponent(cityId)}`,
      { signal: controller.signal }
    );

    const payload = (await response.json()) as ApiOk | ApiFail;
    if (!payload.ok) {
      updateError(state, payload.error?.message);
      return;
    }

    if (state.currentCityId !== cityId) {
      return;
    }

    updateCard(state, payload);
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }
    updateError(state);
  } finally {
    if (state.inflight === controller) {
      state.inflight = undefined;
    }
  }
};

const buildCardState = (
  card: HTMLElement,
  fallbackIndex: number
): CardState | null => {
  const select = query<HTMLSelectElement>(card, "[data-city-select]");
  const temp = query<HTMLElement>(card, "[data-temp]");
  const humidity = query<HTMLElement>(card, "[data-humidity]");
  const pressure = query<HTMLElement>(card, "[data-pressure]");
  const localTime = query<HTMLElement>(card, "[data-local-time]");
  const wind = query<HTMLElement>(card, "[data-wind]");
  const condition = query<HTMLElement>(card, "[data-condition]");
  const cacheBadge = query<HTMLElement>(card, "[data-cache-badge]");
  const updatedBadge = query<HTMLElement>(card, "[data-updated-badge]");

  if (
    !select ||
    !temp ||
    !humidity ||
    !pressure ||
    !localTime ||
    !wind ||
    !condition ||
    !cacheBadge ||
    !updatedBadge
  ) {
    return null;
  }

  const index = card.dataset.cardIndex ?? String(fallbackIndex);

  return {
    card,
    index,
    storageKey: `${STORAGE_PREFIX}${index}`,
    select,
    temp,
    humidity,
    pressure,
    localTime,
    wind,
    condition,
    cacheBadge,
    updatedBadge,
  };
};

const tickUpdatedBadges = (cards: CardState[]): void => {
  const now = Date.now();
  cards.forEach((state) => {
    if (!state.lastUpdatedAt) {
      return;
    }
    const deltaSeconds = Math.max(
      0,
      Math.floor((now - state.lastUpdatedAt) / 1000)
    );
    setUpdatedBadge(state, deltaSeconds);
  });
};

const initWeatherDashboard = (): void => {
  const cardNodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-city-card]")
  );
  if (!cardNodes.length) {
    return;
  }

  const cards = cardNodes
    .map((card, index) => buildCardState(card, index))
    .filter((card): card is CardState => Boolean(card));

  if (!cards.length) {
    return;
  }

  cards.forEach((state) => {
    const storedCity = safeStorageGet(state.storageKey);
    if (storedCity && state.select.querySelector(`option[value="${storedCity}"]`)) {
      state.select.value = storedCity;
    }

    const cityId = state.select.value.trim();
    if (cityId) {
      void fetchWeather(state, cityId);
    } else {
      clearCard(state);
    }

    state.select.addEventListener("change", () => {
      const selected = state.select.value.trim();
      if (selected) {
        safeStorageSet(state.storageKey, selected);
        void fetchWeather(state, selected);
      } else {
        safeStorageRemove(state.storageKey);
        clearCard(state);
      }
    });
  });

  setInterval(() => {
    cards.forEach((state) => {
      const cityId = state.select.value.trim();
      if (cityId) {
        void fetchWeather(state, cityId);
      }
    });
  }, REFRESH_INTERVAL_MS);

  setInterval(() => {
    tickUpdatedBadges(cards);
  }, UPDATED_TICK_MS);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWeatherDashboard);
} else {
  initWeatherDashboard();
}

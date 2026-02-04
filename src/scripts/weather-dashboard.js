const STORAGE_PREFIX = "weather-dashboard:card:";
const REFRESH_INTERVAL_MS = 90_000;
const UPDATED_TICK_MS = 1_000;

const statusLabels = {
  idle: "--",
  loading: "Loading",
  live: "Live",
  cached: "Cached",
  error: "Error",
};

const query = (root, selector) => root.querySelector(selector);

const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};

const safeStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (private mode / blocked storage).
  }
};

const safeStorageRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors (private mode / blocked storage).
  }
};

const formatLocalTime = (value) => {
  if (!value) {
    return "--:--";
  }
  const parts = value.split("T");
  if (parts.length === 2) {
    return parts[1].slice(0, 5);
  }
  return value;
};

const formatNumber = (value, unit) => `${Math.round(value)}${unit}`;

const setStatusBadge = (state, status) => {
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

const setUpdatedBadge = (state, seconds) => {
  if (seconds === null || Number.isNaN(seconds)) {
    state.updatedBadge.textContent = "Updated --";
    return;
  }
  state.updatedBadge.textContent = `Updated ${seconds}s ago`;
};

const clearCard = (state) => {
  state.temp.textContent = "--°C";
  state.humidity.textContent = "--%";
  state.pressure.textContent = "---- hPa";
  state.localTime.textContent = "--:--";
  state.wind.textContent = "-- km/h";
  state.condition.textContent = "--";
  state.errorRow.hidden = true;
  state.errorMessage.textContent = "--";
  state.lastUpdatedAt = undefined;
  setStatusBadge(state, "idle");
  setUpdatedBadge(state, null);
};

const updateCard = (state, payload) => {
  const { weather, meta } = payload;
  state.temp.textContent = `${Math.round(weather.tempC)}°C`;
  state.humidity.textContent = formatNumber(weather.humidityPct, "%");
  state.pressure.textContent = formatNumber(weather.pressureHpa, " hPa");
  state.localTime.textContent = formatLocalTime(weather.localTime);
  state.wind.textContent = `${Math.round(weather.windKph)} km/h ${weather.windDir}`;
  state.condition.textContent = weather.condition;
  state.errorRow.hidden = true;
  state.errorMessage.textContent = "--";
  state.lastUpdatedAt = Date.parse(weather.updatedAt);
  const deltaSeconds = Math.max(
    0,
    Math.floor((Date.now() - state.lastUpdatedAt) / 1000)
  );
  setUpdatedBadge(state, deltaSeconds);
  setStatusBadge(state, meta.cached ? "cached" : "live");
};

const updateError = (state, message) => {
  state.temp.textContent = "--°C";
  state.humidity.textContent = "--%";
  state.pressure.textContent = "---- hPa";
  state.localTime.textContent = "--:--";
  state.wind.textContent = "-- km/h";
  state.condition.textContent = "--";
  const safeMessage = message?.trim();
  state.errorRow.hidden = false;
  state.errorMessage.textContent = safeMessage || "Weather unavailable";
  state.lastUpdatedAt = undefined;
  setStatusBadge(state, "error");
  setUpdatedBadge(state, null);
};

const fetchWeather = async (state, cityId) => {
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

    const payload = await response.json();
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

const buildCardState = (card, fallbackIndex) => {
  const select = query(card, "[data-city-select]");
  const temp = query(card, "[data-temp]");
  const humidity = query(card, "[data-humidity]");
  const pressure = query(card, "[data-pressure]");
  const localTime = query(card, "[data-local-time]");
  const wind = query(card, "[data-wind]");
  const condition = query(card, "[data-condition]");
  const errorRow = query(card, "[data-error-row]");
  const errorMessage = query(card, "[data-error-message]");
  const cacheBadge = query(card, "[data-cache-badge]");
  const updatedBadge = query(card, "[data-updated-badge]");

  if (
    !select ||
    !temp ||
    !humidity ||
    !pressure ||
    !localTime ||
    !wind ||
    !condition ||
    !errorRow ||
    !errorMessage ||
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
    errorRow,
    errorMessage,
    cacheBadge,
    updatedBadge,
  };
};

const tickUpdatedBadges = (cards) => {
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

const initWeatherDashboard = () => {
  const cardNodes = Array.from(
    document.querySelectorAll("[data-city-card]")
  );
  if (!cardNodes.length) {
    return;
  }

  const cards = cardNodes
    .map((card, index) => buildCardState(card, index))
    .filter(Boolean);

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

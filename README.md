# weather-dashboard

## Architecture

- `src/pages/weather.astro` renders the `/weather` page and loads the dashboard.
- `src/components/WeatherDashboard.astro` + `src/components/CityWeatherCard.astro` build the UI layout.
- `src/scripts/weather-dashboard.ts` runs in the browser, fetches data, and updates each card.
- `src/pages/api/v1/*` exposes API routes for health, cities, and current weather.
- `src/lib/services/openMeteo.ts` fetches provider data, `src/lib/services/weatherService.ts` normalizes it.
- `src/lib/cache` provides an in-memory cache for current weather responses.

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/cities`
- `GET /api/v1/weather/current?cityId=nyc`

Examples:

```bash
curl http://localhost:4321/api/v1/cities
```

```bash
curl "http://localhost:4321/api/v1/weather/current?cityId=nyc"
```

## Run Local

```bash
npm install
npm run dev
```

Open `http://localhost:4321/weather`.

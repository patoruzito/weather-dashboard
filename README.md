# weather-dashboard

## API

- API v1 health endpoint: `GET /api/v1/health`
- API v1 cities endpoint: `GET /api/v1/cities`
- API v1 current weather endpoint: `GET /api/v1/weather/current?cityId=nyc`

Examples:

```bash
curl http://localhost:4321/api/v1/cities
```

```bash
curl "http://localhost:4321/api/v1/weather/current?cityId=nyc"
```

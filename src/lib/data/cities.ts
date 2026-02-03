export type City = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
};

export const cities: City[] = [
  { id: "nyc", name: "New York City", country: "US", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { id: "lax", name: "Los Angeles", country: "US", lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles" },
  { id: "chi", name: "Chicago", country: "US", lat: 41.8781, lon: -87.6298, tz: "America/Chicago" },
  { id: "mia", name: "Miami", country: "US", lat: 25.7617, lon: -80.1918, tz: "America/New_York" },
  { id: "sea", name: "Seattle", country: "US", lat: 47.6062, lon: -122.3321, tz: "America/Los_Angeles" },
  { id: "den", name: "Denver", country: "US", lat: 39.7392, lon: -104.9903, tz: "America/Denver" },
  { id: "hou", name: "Houston", country: "US", lat: 29.7604, lon: -95.3698, tz: "America/Chicago" },
  { id: "phx", name: "Phoenix", country: "US", lat: 33.4484, lon: -112.074, tz: "America/Phoenix" },
  { id: "bos", name: "Boston", country: "US", lat: 42.3601, lon: -71.0589, tz: "America/New_York" },
  { id: "sfo", name: "San Francisco", country: "US", lat: 37.7749, lon: -122.4194, tz: "America/Los_Angeles" },
  { id: "ldn", name: "London", country: "GB", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { id: "par", name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris" },
  { id: "ber", name: "Berlin", country: "DE", lat: 52.52, lon: 13.405, tz: "Europe/Berlin" },
  { id: "mad", name: "Madrid", country: "ES", lat: 40.4168, lon: -3.7038, tz: "Europe/Madrid" },
  { id: "rom", name: "Rome", country: "IT", lat: 41.9028, lon: 12.4964, tz: "Europe/Rome" },
  { id: "tyo", name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  { id: "sel", name: "Seoul", country: "KR", lat: 37.5665, lon: 126.978, tz: "Asia/Seoul" },
  { id: "sin", name: "Singapore", country: "SG", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { id: "syd", name: "Sydney", country: "AU", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
  { id: "bue", name: "Buenos Aires", country: "AR", lat: -34.6037, lon: -58.3816, tz: "America/Argentina/Buenos_Aires" },
  { id: "mex", name: "Mexico City", country: "MX", lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City" },
  { id: "sao", name: "São Paulo", country: "BR", lat: -23.5505, lon: -46.6333, tz: "America/Sao_Paulo" },
];

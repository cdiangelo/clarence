// Weather with a fallback provider chain. Open-Meteo is tried first; if it
// fails for any reason (blocked host, timeout, bad response), we fall back
// to the US National Weather Service (api.weather.gov) — a completely
// different host/provider, so a problem specific to one doesn't take out
// weather entirely. NWS only covers US locations, which is fine since this
// app is US-golf-course-focused; Open-Meteo remains primary for everywhere else.
import { fetchWithTimeout } from './http';

interface OpenMeteoResult {
  current?: Record<string, unknown>;
  hourly?: Record<string, unknown>;
  [key: string]: unknown;
}

async function tryOpenMeteo(lat: number, lng: number): Promise<OpenMeteoResult | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('current', 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,relative_humidity_2m');
    url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,wind_speed_10m,weather_code');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set('wind_speed_unit', 'mph');
    url.searchParams.set('forecast_days', '1');
    url.searchParams.set('timezone', 'auto');

    const res = await fetchWithTimeout(url.toString(), {});
    if (!res.ok) {
      console.error('[weather] open-meteo non-ok', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json() as OpenMeteoResult;
    if (!data.current && !data.hourly) {
      console.error('[weather] open-meteo returned no current/hourly data', JSON.stringify(data).slice(0, 300));
      return null;
    }
    return data;
  } catch (e) {
    console.error('[weather] open-meteo fetch failed', e);
    return null;
  }
}

interface NwsPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
  probabilityOfPrecipitation?: { value?: number | null };
}

async function tryNws(lat: number, lng: number): Promise<{ periods: NwsPeriod[] } | null> {
  try {
    // NWS requires rounding to ~4 decimal places and a real Accept header
    const pointsRes = await fetchWithTimeout(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
      { Accept: 'application/geo+json' },
    );
    if (!pointsRes.ok) {
      console.error('[weather] nws points non-ok', pointsRes.status, await pointsRes.text().catch(() => ''));
      return null;
    }
    const points = await pointsRes.json() as { properties?: { forecastHourly?: string; forecast?: string } };
    const forecastUrl = points.properties?.forecastHourly ?? points.properties?.forecast;
    if (!forecastUrl) return null;

    const forecastRes = await fetchWithTimeout(forecastUrl, { Accept: 'application/geo+json' });
    if (!forecastRes.ok) {
      console.error('[weather] nws forecast non-ok', forecastRes.status, await forecastRes.text().catch(() => ''));
      return null;
    }
    const forecast = await forecastRes.json() as { properties?: { periods?: NwsPeriod[] } };
    const periods = forecast.properties?.periods ?? [];
    if (periods.length === 0) return null;
    return { periods };
  } catch (e) {
    console.error('[weather] nws fetch failed', e);
    return null;
  }
}

export async function getWeather(lat: number, lng: number, location?: string): Promise<string> {
  const loc = location ?? `${lat},${lng}`;

  const openMeteo = await tryOpenMeteo(lat, lng);
  if (openMeteo) {
    return JSON.stringify({ location: loc, provider: 'open-meteo', ...openMeteo });
  }

  const nws = await tryNws(lat, lng);
  if (nws) {
    const now = nws.periods[0];
    return JSON.stringify({
      location: loc,
      provider: 'nws',
      current: now ? {
        temperature: now.temperature,
        temperatureUnit: now.temperatureUnit ?? 'F',
        windSpeed: now.windSpeed,
        windDirection: now.windDirection,
        shortForecast: now.shortForecast,
        precipChance: now.probabilityOfPrecipitation?.value ?? null,
      } : undefined,
      upcomingPeriods: nws.periods.slice(0, 6).map((p) => ({
        name: p.name, temperature: p.temperature, windSpeed: p.windSpeed,
        windDirection: p.windDirection, shortForecast: p.shortForecast,
      })),
    });
  }

  return 'Weather data unavailable — both providers (Open-Meteo and NWS) failed. Check server logs for [weather] entries.';
}

import { Router } from "express";
import axios from "axios";

const router = Router();

const OPENWEATHER_API_KEY = process.env["OPENWEATHER_API_KEY"] ?? "3f19469876473678134c67413c19cab2";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

function mapWeatherCode(code: number): number {
  if (code >= 200 && code <= 232) return 95;
  if (code >= 300 && code <= 321) return 51;
  if (code >= 500 && code <= 531) return 61;
  if (code >= 600 && code <= 622) return 71;
  if (code >= 701 && code <= 781) return 45;
  if (code === 800) return 0;
  if (code >= 801 && code <= 804) return 3;
  return 0;
}

router.get("/", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(400).json({ message: "lat and lon query params are required" });
      return;
    }

    const [currentWeather, forecastWeather] = await Promise.all([
      axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
          lang: "en",
        },
      }),
      axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
          lang: "en",
          cnt: 8,
        },
      }),
    ]);

    const todayForecast = forecastWeather.data.list?.[0];
    const tomorrowForecast = forecastWeather.data.list?.find((item: { dt_txt?: string }) =>
      item.dt_txt?.includes("12:00:00"),
    );

    const rainProbability = Math.round((todayForecast?.pop ?? 0) * 100);
    const tomorrowRainProbability = Math.round((tomorrowForecast?.pop ?? 0) * 100);

    const weatherData = {
      temperature: Math.round(currentWeather.data.main?.temp ?? 0),
      humidity: Math.round(currentWeather.data.main?.humidity ?? 0),
      windSpeed: Math.round(currentWeather.data.wind?.speed ?? 0),
      rainProbability,
      tomorrowRainProbability,
      weatherCode: mapWeatherCode(currentWeather.data.weather?.[0]?.id ?? 0),
      tomorrowWeatherCode: mapWeatherCode(tomorrowForecast?.weather?.[0]?.id ?? 0),
    };

    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch weather", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
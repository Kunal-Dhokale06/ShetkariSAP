import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useApp } from '@/contexts/AppContext';
import { DISTRICT_COORDS } from '@/constants/district-coordinates';

function getApiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra as { EXPO_PUBLIC_API_URL?: string })?.EXPO_PUBLIC_API_URL ||
    (Constants.manifest?.extra as { EXPO_PUBLIC_API_URL?: string })?.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')
  );
}

function normalizeBackendHost(rawHost: string | undefined): string | null {
  if (!rawHost) return null;
  if (rawHost.startsWith('http://') || rawHost.startsWith('https://')) {
    return rawHost;
  }

  const host = rawHost.split(',')[0].split(':')[0].trim();
  if (!host) return null;
  return `http://${host}:3000`;
}

function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { EXPO_PUBLIC_API_URL?: string } | undefined;
  const manifestExtra = (Constants.manifest?.extra as { EXPO_PUBLIC_API_URL?: string } | undefined);
  const explicitUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    extra?.EXPO_PUBLIC_API_URL ||
    manifestExtra?.EXPO_PUBLIC_API_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  const debuggerHost =
    (Constants.manifest as { debuggerHost?: string } | undefined)?.debuggerHost ||
    (Constants.manifest2 as { debuggerHost?: string } | undefined)?.debuggerHost ||
    (Constants.expoConfig as { hostUri?: string } | undefined)?.hostUri;

  const parsed = normalizeBackendHost(debuggerHost);
  if (parsed) {
    return parsed;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

const API_BASE_URL = getApiBaseUrl();

export interface WeatherData {
  temperature: number;           // °C
  humidity: number;              // %
  windSpeed: number;             // km/h
  rainProbability: number;       // % today
  tomorrowRainProbability: number; // % tomorrow
  weatherCode: number;           // WMO code
  tomorrowWeatherCode: number;
  locationName: string;
  isGPS: boolean;
  fetchedAt: number;             // epoch ms
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

async function fetchWeatherFromApi(lat: number, lng: number): Promise<Omit<WeatherData, 'locationName' | 'isGPS' | 'fetchedAt'>> {
  const params = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lng.toFixed(4),
  });

  const res = await fetch(`${API_BASE_URL}/api/weather?${params.toString()}`);
  if (!res.ok) {
    // try to surface JSON error bodies for easier debugging
    let body = '';
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} ${body}`);
  }

  const raw: unknown = await res.json();
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('temperature' in raw) ||
    !('humidity' in raw) ||
    !('windSpeed' in raw)
  ) {
    throw new Error('Unexpected weather API shape');
  }

  const json = raw as {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
    tomorrowRainProbability: number;
    weatherCode: number;
    tomorrowWeatherCode: number;
  };

  return {
    temperature: Math.round(json.temperature),
    humidity: Math.round(json.humidity),
    windSpeed: Math.round(json.windSpeed),
    rainProbability: Math.round(json.rainProbability),
    tomorrowRainProbability: Math.round(json.tomorrowRainProbability),
    weatherCode: json.weatherCode,
    tomorrowWeatherCode: json.tomorrowWeatherCode,
  };
}

async function resolveLocationName(lat: number, lng: number, defaultName: string) {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const place = places[0];
    if (!place) return defaultName;

    const labelParts = [
      place.name,
      place.street,
      place.city,
      place.subregion,
      place.region,
      place.district,
    ].filter(Boolean);

    return labelParts.join(', ') || defaultName;
  } catch {
    return defaultName;
  }
}

function getFallbackCoordinates(profileDistrict?: string) {
  return DISTRICT_COORDS[profileDistrict ?? ''] ?? DISTRICT_COORDS.Other;
}

export function useWeather(): WeatherState {
  const { profile } = useApp();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let lat: number;
      let lng: number;
      const profileLocation = profile?.village && profile?.district
        ? `${profile.village}, ${profile.district}`
        : profile?.district ?? 'Your Location';
      let locationName = profileLocation;
      let isGPS = false;

      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
            isGPS = true;
            locationName = await resolveLocationName(lat, lng, profileLocation);
          } catch {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown) {
              lat = lastKnown.coords.latitude;
              lng = lastKnown.coords.longitude;
              isGPS = true;
              locationName = await resolveLocationName(lat, lng, profileLocation);
            } else {
              const coords = getFallbackCoordinates(profile?.district);
              lat = coords.lat;
              lng = coords.lng;
            }
          }
        } else {
          const coords = getFallbackCoordinates(profile?.district);
          lat = coords.lat;
          lng = coords.lng;
        }
      } else {
        const coords = getFallbackCoordinates(profile?.district);
        lat = coords.lat;
        lng = coords.lng;
      }

      const weather = await fetchWeatherFromApi(lat, lng);
      setData({ ...weather, locationName, isGPS, fetchedAt: Date.now() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, [profile?.district]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { data, loading, error, refetch: fetchWeather };
}

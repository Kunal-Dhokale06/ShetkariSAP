import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useWeather, WeatherData } from '@/hooks/useWeather';

// ── WMO code → emoji + i18n key ────────────────────────────────────────────
function getWeatherInfo(code: number): { emoji: string; labelKey: string } {
  if (code === 0)                   return { emoji: '☀️',  labelKey: 'clearSky' };
  if (code <= 2)                    return { emoji: '⛅',  labelKey: 'partlyCloudy' };
  if (code === 3)                   return { emoji: '☁️',  labelKey: 'overcast' };
  if (code <= 48)                   return { emoji: '🌫️', labelKey: 'foggy' };
  if (code <= 55)                   return { emoji: '🌦️', labelKey: 'drizzle' };
  if (code <= 67)                   return { emoji: '🌧️', labelKey: 'rainy' };
  if (code <= 77)                   return { emoji: '❄️',  labelKey: 'snowy' };
  if (code <= 82)                   return { emoji: '🌦️', labelKey: 'rainShowers' };
  if (code <= 99)                   return { emoji: '⛈️',  labelKey: 'thunderstorm' };
  return                                   { emoji: '🌡️', labelKey: 'clearSky' };
}

// ── Advisory generator ──────────────────────────────────────────────────────
type TipType = 'good' | 'warning' | 'danger';
interface Tip { text: string; type: TipType }

function generateAdvisory(
  data: WeatherData,
  t: (k: string) => string,
): Tip[] {
  const seen = new Set<string>();
  const tips: Tip[] = [];

  const add = (key: string, type: TipType) => {
    const text = t(key);
    if (!seen.has(text)) { seen.add(text); tips.push({ text, type }); }
  };

  // Thunder / storm
  if (data.weatherCode >= 95) {
    add('weather.advisory.thunderstormWarning', 'danger');
    add('weather.advisory.avoidPesticide', 'danger');
  }

  // Rain
  if (data.tomorrowRainProbability >= 60 || data.rainProbability >= 60) {
    if (data.tomorrowRainProbability >= 60) add('weather.advisory.rainExpected', 'warning');
    add('weather.advisory.postponeFertilizer', 'warning');
    add('weather.advisory.avoidPesticide', 'warning');
  } else if (data.tomorrowRainProbability >= 35 || data.rainProbability >= 35) {
    add('weather.advisory.possibleRain', 'warning');
    add('weather.advisory.checkIrrigation', 'good');
  } else {
    add('weather.advisory.drySpell', 'good');
  }

  // Wind
  if (data.windSpeed >= 25) {
    add('weather.advisory.highWind', 'danger');
    add('weather.advisory.avoidPesticide', 'danger');
  } else if (data.windSpeed >= 15) {
    add('weather.advisory.moderateWind', 'warning');
  }

  // Temperature
  if (data.temperature >= 36) {
    add('weather.advisory.highTemp', 'warning');
    add('weather.advisory.irrigateEarlyEvening', 'good');
  } else if (data.temperature <= 12) {
    add('weather.advisory.lowTemp', 'warning');
  }

  if (tips.length === 0) add('weather.advisory.goodConditions', 'good');

  return tips.slice(0, 5);
}

// ── Stat pill ───────────────────────────────────────────────────────────────
function Stat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statPill, { backgroundColor: colors.accent }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Main widget ─────────────────────────────────────────────────────────────
export function WeatherWidget() {
  const colors = useColors();
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useWeather();

  // ── Loading skeleton ──
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.locationRow}>
            <MaterialIcons name="cloud" size={14} color={colors.primary} />
            <Text style={[styles.locationTxt, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {t('weather.loading')}
            </Text>
          </View>
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTxt, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {t('weather.loading')}
          </Text>
        </View>
      </View>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.errorBox}>
          <Text style={styles.errorEmoji}>🌐</Text>
          <Text style={[styles.errorTxt, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {t('weather.error')}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <MaterialIcons name="refresh" size={16} color="#fff" />
            <Text style={[styles.retryTxt, { fontFamily: 'Inter_600SemiBold', color: '#fff' }]}>
              {t('weather.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { emoji, labelKey } = getWeatherInfo(data.weatherCode);
  const tips = generateAdvisory(data, t);

  const tipIcon = (type: TipType) =>
    type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : '✔';

  const tipColor = (type: TipType) =>
    type === 'danger' ? colors.error : type === 'warning' ? colors.warning : colors.success;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View style={styles.locationRow}>
          <MaterialIcons
            name={data.isGPS ? 'gps-fixed' : 'location-on'}
            size={13}
            color={colors.primary}
          />
          <Text style={[styles.locationTxt, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}> 
            {data.isGPS
              ? `${t('weather.gpsLocation')} · ${data.locationName}`
              : data.locationName}
          </Text>
        </View>
        <TouchableOpacity onPress={refetch} hitSlop={12} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── Main weather ── */}
      <View style={[styles.mainWeather, { backgroundColor: colors.primary + '14', borderRadius: 14 }]}>
        <Text style={styles.weatherEmoji}>{emoji}</Text>
        <View style={styles.mainWeatherText}>
          <Text style={[styles.temperature, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {data.temperature}°C
          </Text>
          <Text style={[styles.conditionTxt, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {t(`weather.conditions.${labelKey}`)}
          </Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <Stat emoji="💧" label={t('weather.humidity')} value={`${data.humidity}%`} />
        <Stat emoji="💨" label={t('weather.wind')} value={`${data.windSpeed} km/h`} />
        <Stat emoji="🌧" label={t('weather.rainChance')} value={`${data.rainProbability}%`} />
      </View>

      {/* ── Tomorrow rain chip ── */}
      {data.tomorrowRainProbability > 0 && (
        <View
          style={[
            styles.tomorrowRow,
            {
              backgroundColor:
                data.tomorrowRainProbability >= 60
                  ? colors.warning + '22'
                  : colors.accent,
            },
          ]}
        >
          <Text style={styles.tomorrowEmoji}>
            {data.tomorrowRainProbability >= 60 ? '🌧️' : '⛅'}
          </Text>
          <Text style={[styles.tomorrowTxt, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
            {t('weather.tomorrowRain')}:{' '}
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>
              {data.tomorrowRainProbability}%
            </Text>
          </Text>
        </View>
      )}

      {/* ── Farmer Advisory ── */}
      <View style={[styles.advisory, { borderTopColor: colors.divider }]}>
        <View style={styles.advisoryHeader}>
          <Text style={styles.advisoryIcon}>🌾</Text>
          <Text style={[styles.advisoryTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {t('weather.farmerAdvisory')}
          </Text>
        </View>
        {tips.map((tip, idx) => (
          <View key={idx} style={styles.tipRow}>
            <Text style={[styles.tipBullet, { color: tipColor(tip.type) }]}>
              {tipIcon(tip.type)}
            </Text>
            <Text style={[styles.tipText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
              {tip.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxt: { fontSize: 12 },

  // Loading / error
  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  loadingTxt: { fontSize: 13 },
  errorBox: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  errorEmoji: { fontSize: 32 },
  errorTxt: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  retryTxt: { fontSize: 14 },

  // Main weather
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  weatherEmoji: { fontSize: 52 },
  mainWeatherText: { flex: 1 },
  temperature: { fontSize: 40, lineHeight: 44 },
  conditionTxt: { fontSize: 14, marginTop: 2 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 2,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 14 },
  statLabel: { fontSize: 11 },

  // Tomorrow
  tomorrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 2,
  },
  tomorrowEmoji: { fontSize: 16 },
  tomorrowTxt: { fontSize: 13 },

  // Advisory
  advisory: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  advisoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  advisoryIcon: { fontSize: 16 },
  advisoryTitle: { fontSize: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipBullet: { fontSize: 14, lineHeight: 20, minWidth: 20 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

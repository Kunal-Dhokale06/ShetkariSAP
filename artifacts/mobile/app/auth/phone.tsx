import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; native: string }[] = [
  { code: 'mr', native: 'मराठी' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'en', native: 'English' },
];

const API_BASE = process.env['EXPO_PUBLIC_DOMAIN']
  ? `https://${process.env['EXPO_PUBLIC_DOMAIN']}/api`
  : 'http://localhost:8080/api';

export default function PhoneScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useApp();
  const isWeb = Platform.OS === 'web';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const cleaned = phone.trim();
    if (!/^\d{10}$/.test(cleaned)) {
      setError(t('validation.invalidMobile'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleaned }),
      });
      const data = (await res.json()) as { success?: boolean; devOtp?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? t('auth.networkError'));
      await AsyncStorage.setItem('@kisan/pending_phone', cleaned);
      // Store devOtp so OTP screen can display it for testers
      if (data.devOtp) {
        await AsyncStorage.setItem('@kisan/dev_otp', data.devOtp);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/auth/otp');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('auth.networkError');
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.primary, paddingTop: isWeb ? 80 : 64 },
          ]}
        >
          {/* Language strip */}
          <View style={[styles.langStrip, { alignSelf: 'flex-end' }]}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[
                  styles.langBtn,
                  language === lang.code && { backgroundColor: 'rgba(255,255,255,0.25)' },
                ]}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color: '#fff',
                      fontFamily:
                        language === lang.code ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    },
                  ]}
                >
                  {lang.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Illustration */}
          <View style={styles.illustWrap}>
            <View style={[styles.illustCircle, { backgroundColor: colors.primaryDark }]}>
              <MaterialIcons name="smartphone" size={44} color="#fff" />
            </View>
            {/* Decorative floating badges */}
            {([
              { emoji: '🌾', pos: styles.badgeTL },
              { emoji: '🌿', pos: styles.badgeTR },
              { emoji: '🌱', pos: styles.badgeBL },
              { emoji: '🌻', pos: styles.badgeBR },
            ] as const).map(({ emoji, pos }) => (
              <View key={emoji} style={[styles.badge, pos, { backgroundColor: '#fff' }]}>
                <Text style={styles.badgeEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.heroTitle, { color: '#fff', fontFamily: 'Inter_700Bold' }]}>
            {t('auth.phoneTitle')}
          </Text>
          <Text style={[styles.heroSub, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
            {t('auth.phoneSubtitle')}
          </Text>
        </View>

        {/* ── Form card ────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
            {t('auth.enterPhone')}
          </Text>

          {/* Phone input row */}
          <View
            style={[
              styles.phoneRow,
              {
                borderColor: error ? colors.error : phone.length === 10 ? colors.success : colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            {/* Country selector (display-only, India only) */}
            <View style={[styles.countryCode, { borderRightColor: colors.border }]}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={[styles.countryTxt, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                +91
              </Text>
            </View>
            <TextInput
              style={[styles.phoneInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              placeholder="XXXXXXXXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={v => {
                setPhone(v.replace(/\D/g, ''));
                setError('');
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSend}
            />
            {phone.length === 10 && (
              <MaterialIcons name="check-circle" size={22} color={colors.success} style={{ marginRight: 14 }} />
            )}
          </View>

          {/* Digit progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i < phone.length ? colors.primary : colors.border },
                ]}
              />
            ))}
          </View>

          {!!error && (
            <View style={styles.errorRow}>
              <MaterialIcons name="error-outline" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_400Regular' }]}>
                {error}
              </Text>
            </View>
          )}


          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || phone.length < 10}
            activeOpacity={0.85}
            style={[
              styles.sendBtn,
              { backgroundColor: phone.length < 10 ? colors.disabled : colors.primary },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#fff" />
                <Text style={[styles.sendBtnTxt, { fontFamily: 'Inter_700Bold', color: '#fff' }]}>
                  {t('auth.sendOtp')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info row */}
          <View style={styles.infoRow}>
            <MaterialIcons name="lock-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.helpText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {t('auth.phoneHelp')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center' },
  langStrip: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  langBtnText: { fontSize: 13 },
  illustWrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illustCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  badgeTL: { top: 2, left: 2 },
  badgeTR: { top: 2, right: 2 },
  badgeBL: { bottom: 2, left: 2 },
  badgeBR: { bottom: 2, right: 2 },
  badgeEmoji: { fontSize: 17 },
  heroTitle: { fontSize: 22, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { margin: 20, borderRadius: 20, padding: 24, borderWidth: 1 },
  inputLabel: { fontSize: 14, marginBottom: 10 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    gap: 6,
  },
  flag: { fontSize: 22 },
  countryTxt: { fontSize: 16 },
  phoneInput: { flex: 1, fontSize: 20, paddingHorizontal: 14, paddingVertical: 14, letterSpacing: 3 },
  dotsRow: { flexDirection: 'row', gap: 4, marginBottom: 8, paddingHorizontal: 2 },
  dot: { flex: 1, height: 3, borderRadius: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  errorText: { fontSize: 12 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginTop: 4,
  },
  sendBtnTxt: { fontSize: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 },
  helpText: { fontSize: 12, lineHeight: 18 },
});

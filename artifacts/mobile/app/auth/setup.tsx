import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { FormInput, OptionChip } from '@/components/Cards';
import { DropdownPicker } from '@/components/DropdownPicker';
import {
  MAHARASHTRA_DISTRICTS,
  getTalukasByDistrict,
} from '@/constants/indian-locations';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; native: string; label: string }[] = [
  { code: 'mr', native: 'मराठी', label: 'Marathi' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi' },
  { code: 'en', native: 'English', label: 'English' },
];

const DISTRICT_OPTIONS = MAHARASHTRA_DISTRICTS.map(d => ({
  label: d.label,
  value: d.value,
  emoji: '📍',
}));

export default function SetupScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const { language, setLanguage, saveProfile, verifiedPhone } = useApp();
  const isWeb = Platform.OS === 'web';

  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmArea, setFarmArea] = useState('');

  const [nameErr, setNameErr] = useState('');
  const [villageErr, setVillageErr] = useState('');
  const [districtErr, setDistrictErr] = useState('');
  const [farmNameErr, setFarmNameErr] = useState('');
  const [farmAreaErr, setFarmAreaErr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Talukas filtered by selected district
  const talukaOptions = getTalukasByDistrict(district).map(t => ({
    label: t,
    value: t,
  }));

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setTaluka(''); // reset taluka when district changes
    setDistrictErr('');
  };

  const validate = () => {
    let ok = true;
    if (!name.trim()) { setNameErr(t('validation.required')); ok = false; } else setNameErr('');
    if (!village.trim()) { setVillageErr(t('validation.required')); ok = false; } else setVillageErr('');
    if (!district) { setDistrictErr(t('validation.required')); ok = false; } else setDistrictErr('');
    if (!farmName.trim()) { setFarmNameErr(t('validation.required')); ok = false; } else setFarmNameErr('');
    const areaNum = parseFloat(farmArea);
    if (!farmArea || isNaN(areaNum) || areaNum <= 0) {
      setFarmAreaErr(t('validation.invalidArea'));
      ok = false;
    } else setFarmAreaErr('');
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await saveProfile(
        {
          id: '',
          name: name.trim(),
          mobile: verifiedPhone ?? '',
          village: village.trim(),
          taluka: taluka.trim(),
          district: district.trim(),
        },
        farmName.trim(),
        parseFloat(farmArea),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <View
          style={[styles.hero, { backgroundColor: colors.primary, paddingTop: isWeb ? 80 : 60 }]}
        >
          {/* Illustration cluster */}
          <View style={styles.illustRow}>
            <Text style={styles.sideEmoji}>🌾</Text>
            <View style={[styles.heroIcon, { backgroundColor: colors.primaryDark }]}>
              <MaterialIcons name="eco" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.sideEmoji}>🌿</Text>
          </View>
          <Text style={[styles.heroTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
            {t('profile.welcomeTitle')}
          </Text>
          <Text style={[styles.heroSub, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
            {t('profile.welcomeSubtitle')}
          </Text>
        </View>

        <View style={styles.content}>
          {/* ── Language ─────────────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {t('profile.selectLanguage')}
          </Text>
          <View style={styles.langRow}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.8}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor:
                      language === lang.code ? colors.primary : colors.card,
                    borderColor:
                      language === lang.code ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color:
                        language === lang.code ? '#fff' : colors.foreground,
                      fontFamily:
                        language === lang.code
                          ? 'Inter_700Bold'
                          : 'Inter_400Regular',
                    },
                  ]}
                >
                  {lang.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Verified phone badge ─────────────────────────────────────── */}
          {verifiedPhone ? (
            <View
              style={[
                styles.verifiedRow,
                { backgroundColor: colors.accent, borderColor: colors.success },
              ]}
            >
              <Text style={styles.verifiedFlag}>🇮🇳</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.verifiedLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {t('profile.mobile')}
                </Text>
                <Text style={[styles.verifiedNumber, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  +91 {verifiedPhone}
                </Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                <MaterialIcons name="verified" size={14} color="#fff" />
                <Text style={[styles.verifiedBadgeText, { fontFamily: 'Inter_600SemiBold', color: '#fff' }]}>
                  Verified
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── Profile section ─────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold', marginBottom: 0 }]}>
              {t('profile.title')}
            </Text>
          </View>

          <FormInput
            label={t('profile.fullName')}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Patil"
            error={nameErr}
            autoCapitalize="words"
            autoFocus={!verifiedPhone}
          />
          <FormInput
            label={t('profile.village')}
            value={village}
            onChangeText={setVillage}
            placeholder="e.g. Saswad"
            error={villageErr}
            autoCapitalize="words"
          />

          {/* District dropdown */}
          <DropdownPicker
            label={t('profile.district')}
            placeholder={t('profile.selectDistrict')}
            options={DISTRICT_OPTIONS}
            value={district}
            onChange={handleDistrictChange}
            searchable
            error={districtErr}
          />

          {/* Taluka dropdown (enabled once district is selected) */}
          <DropdownPicker
            label={t('profile.taluka')}
            placeholder={
              district
                ? t('profile.selectTaluka')
                : t('profile.selectDistrictFirst')
            }
            options={talukaOptions}
            value={taluka}
            onChange={val => setTaluka(val)}
            searchable={talukaOptions.length > 5}
            disabled={!district || talukaOptions.length === 0}
          />

          {/* ── Farm section ─────────────────────────────────────────────── */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.sectionHeader}>
            <MaterialIcons name="terrain" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold', marginBottom: 0 }]}>
              {t('profile.farmSetup')}
            </Text>
          </View>

          <FormInput
            label={t('profile.farmName')}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="e.g. Patil Farm"
            error={farmNameErr}
            autoCapitalize="words"
          />
          <FormInput
            label={t('profile.farmArea')}
            value={farmArea}
            onChangeText={setFarmArea}
            placeholder="e.g. 5.0"
            error={farmAreaErr}
            keyboardType="decimal-pad"
          />

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
            style={[
              styles.saveBtn,
              { backgroundColor: isSaving ? colors.disabled : colors.primary },
            ]}
          >
            <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
            <Text style={[styles.saveBtnText, { fontFamily: 'Inter_700Bold', color: '#FFFFFF' }]}>
              {isSaving ? t('common.loading') : t('profile.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center' },
  illustRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  sideEmoji: { fontSize: 30 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  content: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, marginBottom: 14 },
  langRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  langBtnText: { fontSize: 15 },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  verifiedFlag: { fontSize: 24 },
  verifiedLabel: { fontSize: 11, marginBottom: 2 },
  verifiedNumber: { fontSize: 16 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedBadgeText: { fontSize: 12 },
  divider: { height: 1, marginVertical: 20 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16 },
});

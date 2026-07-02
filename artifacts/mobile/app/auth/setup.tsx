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
import type { Language } from '@/types';

const LANGUAGES: { code: Language; native: string; label: string }[] = [
  { code: 'mr', native: 'मराठी', label: 'Marathi' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi' },
  { code: 'en', native: 'English', label: 'English' },
];

export default function SetupScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const { language, setLanguage, saveProfile } = useApp();
  const isWeb = Platform.OS === 'web';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmArea, setFarmArea] = useState('');

  const [nameErr, setNameErr] = useState('');
  const [mobileErr, setMobileErr] = useState('');
  const [villageErr, setVillageErr] = useState('');
  const [farmNameErr, setFarmNameErr] = useState('');
  const [farmAreaErr, setFarmAreaErr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    let ok = true;
    if (!name.trim()) { setNameErr(t('validation.required')); ok = false; } else setNameErr('');
    if (!mobile.trim() || !/^\d{10}$/.test(mobile.trim())) { setMobileErr(t('validation.invalidMobile')); ok = false; } else setMobileErr('');
    if (!village.trim()) { setVillageErr(t('validation.required')); ok = false; } else setVillageErr('');
    if (!farmName.trim()) { setFarmNameErr(t('validation.required')); ok = false; } else setFarmNameErr('');
    const areaNum = parseFloat(farmArea);
    if (!farmArea || isNaN(areaNum) || areaNum <= 0) { setFarmAreaErr(t('validation.invalidArea')); ok = false; } else setFarmAreaErr('');
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
          mobile: mobile.trim(),
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
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: isWeb ? 80 : 60 }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primaryDark }]}>
            <MaterialIcons name="eco" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.heroTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
            {t('profile.welcomeTitle')}
          </Text>
          <Text style={[styles.heroSub, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
            {t('profile.welcomeSubtitle')}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Language Selection */}
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {t('profile.selectLanguage')}
          </Text>
          <View style={styles.langRow}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLanguage(lang.code);
                }}
                activeOpacity={0.8}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor: language === lang.code ? colors.primary : colors.secondary,
                    borderColor: language === lang.code ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.langNative, {
                  color: language === lang.code ? '#FFFFFF' : colors.foreground,
                  fontFamily: language === lang.code ? 'Inter_700Bold' : 'Inter_500Medium',
                }]}>
                  {lang.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Profile Section */}
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {t('profile.title')}
          </Text>
          <FormInput
            label={t('profile.fullName')}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Patil"
            error={nameErr}
            autoCapitalize="words"
          />
          <FormInput
            label={t('profile.mobile')}
            value={mobile}
            onChangeText={setMobile}
            placeholder="9XXXXXXXXX"
            error={mobileErr}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <FormInput
            label={t('profile.village')}
            value={village}
            onChangeText={setVillage}
            placeholder="e.g. Saswad"
            error={villageErr}
            autoCapitalize="words"
          />
          <FormInput
            label={t('profile.taluka')}
            value={taluka}
            onChangeText={setTaluka}
            placeholder="e.g. Purandar"
            autoCapitalize="words"
          />
          <FormInput
            label={t('profile.district')}
            value={district}
            onChangeText={setDistrict}
            placeholder="e.g. Pune"
            autoCapitalize="words"
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Farm Section */}
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {t('profile.farmSetup')}
          </Text>
          <FormInput
            label={t('profile.farmName')}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="e.g. Patil Wada Farm"
            error={farmNameErr}
            autoCapitalize="words"
          />
          <FormInput
            label={t('profile.farmArea')}
            value={farmArea}
            onChangeText={setFarmArea}
            placeholder="e.g. 3.5"
            error={farmAreaErr}
            keyboardType="decimal-pad"
          />

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={isSaving}
            style={[
              styles.saveBtn,
              {
                backgroundColor: isSaving ? colors.disabled : colors.primary,
              },
            ]}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
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
  hero: { alignItems: 'center', paddingBottom: 32, paddingHorizontal: 24 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center' },
  content: { padding: 20 },
  sectionLabel: { fontSize: 15, marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  langBtn: {
    flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  langNative: { fontSize: 14 },
  divider: { height: 1, marginVertical: 20 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16 },
});

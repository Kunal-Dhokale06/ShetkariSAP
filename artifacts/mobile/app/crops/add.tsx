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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { FormInput, OptionChip } from '@/components/Cards';
import type { CropStatus, Season } from '@/types';

const SEASONS: Season[] = ['kharif', 'rabi', 'zaid'];
const STATUSES: CropStatus[] = ['active', 'harvested', 'failed'];

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const isValidDateStr = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);

const dateStrToISO = (s: string) => {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).toISOString();
};

export default function AddCropScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { farms, addCrop } = useApp();

  const [cropName, setCropName] = useState('');
  const [season, setSeason] = useState<Season>('kharif');
  const [plantDate, setPlantDate] = useState(todayStr());
  const [harvestDate, setHarvestDate] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<CropStatus>('active');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [cropNameErr, setCropNameErr] = useState('');
  const [plantDateErr, setPlantDateErr] = useState('');
  const [harvestDateErr, setHarvestDateErr] = useState('');
  const [areaErr, setAreaErr] = useState('');

  if (farms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <MaterialIcons name="terrain" size={48} color={colors.disabled} />
        <Text style={[styles.noFarmText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {t('farm.noFarms')}
        </Text>
      </View>
    );
  }

  const validate = () => {
    let ok = true;
    if (!cropName.trim()) { setCropNameErr(t('validation.required')); ok = false; } else setCropNameErr('');
    if (!isValidDateStr(plantDate)) { setPlantDateErr(t('validation.invalidDate')); ok = false; } else setPlantDateErr('');
    if (harvestDate && !isValidDateStr(harvestDate)) { setHarvestDateErr(t('validation.invalidDate')); ok = false; } else setHarvestDateErr('');
    const areaNum = parseFloat(area);
    if (!area || isNaN(areaNum) || areaNum <= 0) { setAreaErr(t('validation.invalidArea')); ok = false; } else setAreaErr('');
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await addCrop({
        farmId: farms[0].id,
        name: cropName.trim(),
        season,
        plantDate: dateStrToISO(plantDate),
        expectedHarvestDate: harvestDate ? dateStrToISO(harvestDate) : dateStrToISO(plantDate),
        area: parseFloat(area),
        status,
        notes: notes.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormInput
          label={t('crop.name')}
          value={cropName}
          onChangeText={setCropName}
          placeholder="e.g. Wheat, Rice, Cotton"
          error={cropNameErr}
          autoCapitalize="words"
          autoFocus
        />

        {/* Season */}
        <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {t('crop.season')}
        </Text>
        <View style={styles.chipRow}>
          {SEASONS.map(s => (
            <OptionChip
              key={s}
              label={t(`crop.${s}`)}
              selected={season === s}
              onPress={() => setSeason(s)}
            />
          ))}
        </View>

        <FormInput
          label={t('crop.plantDate')}
          value={plantDate}
          onChangeText={setPlantDate}
          placeholder="DD/MM/YYYY"
          error={plantDateErr}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <FormInput
          label={t('crop.harvestDate')}
          value={harvestDate}
          onChangeText={setHarvestDate}
          placeholder="DD/MM/YYYY"
          error={harvestDateErr}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <FormInput
          label={t('crop.area')}
          value={area}
          onChangeText={setArea}
          placeholder="e.g. 2.5"
          error={areaErr}
          keyboardType="decimal-pad"
        />

        {/* Status */}
        <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {t('crop.status')}
        </Text>
        <View style={styles.chipRow}>
          {STATUSES.map(s => (
            <OptionChip
              key={s}
              label={t(`crop.${s}`)}
              selected={status === s}
              onPress={() => setStatus(s)}
            />
          ))}
        </View>

        <FormInput
          label={t('crop.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          multiline
          numberOfLines={3}
          style={{ height: 84, textAlignVertical: 'top', paddingTop: 12 }}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: isSaving ? colors.disabled : colors.primary }]}
        >
          <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
          <Text style={[styles.saveBtnText, { fontFamily: 'Inter_700Bold', color: '#FFFFFF' }]}>
            {isSaving ? t('common.loading') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 14, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
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
  noFarmText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
});

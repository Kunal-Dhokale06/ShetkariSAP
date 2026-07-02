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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { EmptyState, FormInput, OptionChip } from '@/components/Cards';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types';

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const isValidDateStr = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);

const dateStrToISO = (s: string) => {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).toISOString();
};

export default function AddExpenseScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { cropId: prefillCropId } = useLocalSearchParams<{ cropId?: string }>();
  const { crops, addExpense } = useApp();

  const [selectedCropId, setSelectedCropId] = useState(
    crops.find(c => c.id === prefillCropId)?.id ?? crops[0]?.id ?? ''
  );
  const [category, setCategory] = useState<ExpenseCategory>('seeds');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [amountErr, setAmountErr] = useState('');
  const [dateErr, setDateErr] = useState('');
  const [cropErr, setCropErr] = useState('');

  if (crops.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="leaf-outline"
          title={t('validation.noCrops')}
          subtitle={t('crop.addFirst')}
          action={{ label: t('crop.add'), onPress: () => router.push('/crops/add') }}
        />
      </View>
    );
  }

  const validate = () => {
    let ok = true;
    if (!selectedCropId) { setCropErr(t('validation.selectCrop')); ok = false; } else setCropErr('');
    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) { setAmountErr(t('validation.invalidAmount')); ok = false; } else setAmountErr('');
    if (!isValidDateStr(date)) { setDateErr(t('validation.invalidDate')); ok = false; } else setDateErr('');
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await addExpense({
        cropId: selectedCropId,
        category,
        amount: parseFloat(amount),
        date: dateStrToISO(date),
        description: description.trim(),
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
        {/* Crop Selector */}
        <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {t('expense.crop')}
        </Text>
        {cropErr ? (
          <Text style={[styles.fieldError, { color: colors.error, fontFamily: 'Inter_400Regular' }]}>{cropErr}</Text>
        ) : null}
        <View style={styles.chipRow}>
          {crops.map(crop => (
            <OptionChip
              key={crop.id}
              label={crop.name}
              selected={selectedCropId === crop.id}
              onPress={() => {
                setSelectedCropId(crop.id);
                setCropErr('');
              }}
            />
          ))}
        </View>

        {/* Category */}
        <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {t('expense.category')}
        </Text>
        <View style={styles.chipRow}>
          {EXPENSE_CATEGORIES.map(cat => (
            <OptionChip
              key={cat}
              label={t(`expense.${cat}`)}
              selected={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </View>

        <FormInput
          label={t('expense.amount')}
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 5000"
          error={amountErr}
          keyboardType="decimal-pad"
          autoFocus
        />
        <FormInput
          label={t('expense.date')}
          value={date}
          onChangeText={setDate}
          placeholder="DD/MM/YYYY"
          error={dateErr}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <FormInput
          label={t('expense.description')}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description..."
          multiline
          numberOfLines={2}
          style={{ height: 72, textAlignVertical: 'top', paddingTop: 12 }}
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
  content: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 14, marginBottom: 8 },
  fieldError: { fontSize: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
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

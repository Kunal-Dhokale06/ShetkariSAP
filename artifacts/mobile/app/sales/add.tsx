import React, { useEffect, useState } from 'react';
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
import { SALE_UNITS, type SaleUnit } from '@/types';

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const isValidDateStr = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);

const dateStrToISO = (s: string) => {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).toISOString();
};

export default function AddSaleScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { cropId: prefillCropId } = useLocalSearchParams<{ cropId?: string }>();
  const { crops, addSale } = useApp();

  const [selectedCropId, setSelectedCropId] = useState(
    crops.find(c => c.id === prefillCropId)?.id ?? crops[0]?.id ?? ''
  );
  const [buyerName, setBuyerName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<SaleUnit>('quintal');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [cropErr, setCropErr] = useState('');
  const [buyerErr, setBuyerErr] = useState('');
  const [qtyErr, setQtyErr] = useState('');
  const [priceErr, setPriceErr] = useState('');
  const [dateErr, setDateErr] = useState('');

  // Auto-calculate total
  useEffect(() => {
    const qty = parseFloat(quantity);
    const price = parseFloat(pricePerUnit);
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      setTotalAmount((qty * price).toFixed(0));
    } else {
      setTotalAmount('');
    }
  }, [quantity, pricePerUnit]);

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
    if (!buyerName.trim()) { setBuyerErr(t('validation.required')); ok = false; } else setBuyerErr('');
    const qtyNum = parseFloat(quantity);
    if (!quantity || isNaN(qtyNum) || qtyNum <= 0) { setQtyErr(t('validation.invalidAmount')); ok = false; } else setQtyErr('');
    const priceNum = parseFloat(pricePerUnit);
    if (!pricePerUnit || isNaN(priceNum) || priceNum <= 0) { setPriceErr(t('validation.invalidAmount')); ok = false; } else setPriceErr('');
    if (!isValidDateStr(date)) { setDateErr(t('validation.invalidDate')); ok = false; } else setDateErr('');
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const qty = parseFloat(quantity);
      const price = parseFloat(pricePerUnit);
      await addSale({
        cropId: selectedCropId,
        buyerName: buyerName.trim(),
        quantity: qty,
        unit,
        pricePerUnit: price,
        totalAmount: qty * price,
        date: dateStrToISO(date),
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
        {/* Crop Selector */}
        <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {t('sale.crop')}
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

        <FormInput
          label={t('sale.buyerName')}
          value={buyerName}
          onChangeText={setBuyerName}
          placeholder="e.g. APMC Market"
          error={buyerErr}
          autoCapitalize="words"
          autoFocus
        />

        <FormInput
          label={t('sale.quantity')}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. 10"
          error={qtyErr}
          keyboardType="decimal-pad"
        />

        {/* Unit Selector */}
        <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {t('sale.unit')}
        </Text>
        <View style={styles.chipRow}>
          {SALE_UNITS.map(u => (
            <OptionChip
              key={u}
              label={t(`sale.${u}`)}
              selected={unit === u}
              onPress={() => setUnit(u)}
            />
          ))}
        </View>

        <FormInput
          label={t('sale.pricePerUnit')}
          value={pricePerUnit}
          onChangeText={setPricePerUnit}
          placeholder="e.g. 2500"
          error={priceErr}
          keyboardType="decimal-pad"
        />

        {/* Auto-calculated Total */}
        {totalAmount ? (
          <View style={[styles.totalBox, { backgroundColor: colors.accent, borderColor: colors.primary }]}>
            <MaterialIcons name="calculate" size={18} color={colors.primary} />
            <Text style={[styles.totalBoxText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
              {t('sale.totalAmount')}: ₹{parseFloat(totalAmount).toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}

        <FormInput
          label={t('sale.date')}
          value={date}
          onChangeText={setDate}
          placeholder="DD/MM/YYYY"
          error={dateErr}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <FormInput
          label={t('sale.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
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
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  totalBoxText: { fontSize: 16 },
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

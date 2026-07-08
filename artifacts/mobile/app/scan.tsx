import React, { useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { FormInput, OptionChip, SectionHeader } from '@/components/Cards';
import { EXPENSE_CATEGORIES, SALE_UNITS, type ExpenseCategory, type SaleUnit } from '@/types';

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const isValidDateStr = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);
const dateStrToISO = (s: string) => {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).toISOString();
};

type ReceiptType = 'expense' | 'sale';

export default function ReceiptScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { crops, addReceiptScan, addExpense, addSale } = useApp();

  const [receiptType, setReceiptType] = useState<ReceiptType>('expense');
  const [selectedCropId, setSelectedCropId] = useState(crops[0]?.id ?? '');
  const [category, setCategory] = useState<ExpenseCategory>('seeds');
  const [buyerName, setBuyerName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<SaleUnit>('quintal');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [cropErr, setCropErr] = useState('');
  const [amountErr, setAmountErr] = useState('');
  const [dateErr, setDateErr] = useState('');
  const [buyerErr, setBuyerErr] = useState('');
  const [quantityErr, setQuantityErr] = useState('');
  const [priceErr, setPriceErr] = useState('');

  useEffect(() => {
    if (!selectedCropId && crops.length > 0) {
      setSelectedCropId(crops[0].id);
    }
  }, [crops, selectedCropId]);

  const totalSaleAmount = useMemo(() => {
    const qty = parseFloat(quantity);
    const price = parseFloat(amount);
    return !isNaN(qty) && !isNaN(price) ? qty * price : 0;
  }, [quantity, amount]);

  const validate = () => {
    let ok = true;
    if (!selectedCropId) { setCropErr(t('validation.selectCrop')); ok = false; } else setCropErr('');
    if (!isValidDateStr(date)) { setDateErr(t('validation.invalidDate')); ok = false; } else setDateErr('');

    if (receiptType === 'expense') {
      const amt = parseFloat(amount);
      if (!amount || isNaN(amt) || amt <= 0) { setAmountErr(t('validation.invalidAmount')); ok = false; } else setAmountErr('');
    } else {
      if (!buyerName.trim()) { setBuyerErr(t('validation.required')); ok = false; } else setBuyerErr('');
      const qty = parseFloat(quantity);
      if (!quantity || isNaN(qty) || qty <= 0) { setQuantityErr(t('validation.invalidAmount')); ok = false; } else setQuantityErr('');
      const price = parseFloat(amount);
      if (!amount || isNaN(price) || price <= 0) { setPriceErr(t('validation.invalidAmount')); ok = false; } else setPriceErr('');
    }
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const parsedData = {
        receiptType,
        category: receiptType === 'expense' ? category : undefined,
        buyerName: receiptType === 'sale' ? buyerName.trim() : undefined,
        quantity: receiptType === 'sale' ? parseFloat(quantity) : undefined,
        unit: receiptType === 'sale' ? unit : undefined,
        amount: parseFloat(amount),
        source: source.trim() || undefined,
      };

      if (receiptType === 'expense') {
        await addExpense({
          cropId: selectedCropId,
          category,
          amount: parseFloat(amount),
          date: dateStrToISO(date),
          description: notes.trim() || source.trim(),
        });
      } else {
        await addSale({
          cropId: selectedCropId,
          buyerName: buyerName.trim(),
          quantity: parseFloat(quantity),
          unit,
          pricePerUnit: parseFloat(amount),
          totalAmount: totalSaleAmount,
          date: dateStrToISO(date),
          notes: notes.trim() || source.trim(),
        });
      }

      await addReceiptScan({
        type: receiptType,
        originalUri: source.trim() || '',
        enhancedUri: null,
        status: 'completed',
        confidence: 0.82,
        parsedData,
        notes: notes.trim() || source.trim() || undefined,
      });

      Alert.alert(t('tools.receiptSaved'), t('tools.receiptSavedSubtitle'));
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setIsSaving(false);
    }
  };

  if (crops.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <SectionHeader title={t('tools.receiptScanner')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.description, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}> 
            {t('validation.noCrops')} 
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/crops/add')}
            activeOpacity={0.8}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.actionText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}> 
              {t('crop.add')} 
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 120 : 110 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: isWeb ? 79 : insets.top + 16 }]}> 
          <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}> 
            {t('tools.receiptScanner')} 
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title={t('tools.receiptScannerSubtitle')} />

          <View style={styles.typeRow}>
            {(['expense', 'sale'] as ReceiptType[]).map(type => (
              <OptionChip
                key={type}
                label={t(type === 'expense' ? 'tools.expenseReceipt' : 'tools.saleReceipt')}
                selected={receiptType === type}
                onPress={() => setReceiptType(type)}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
            {t('tools.selectCrop')}
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

          {receiptType === 'expense' ? (
            <>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {t('tools.expenseCategory')}
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
            </>
          ) : (
            <>
              <FormInput
                label={t('tools.buyerName')}
                value={buyerName}
                onChangeText={setBuyerName}
                placeholder={t('tools.buyerPlaceholder')}
                error={buyerErr}
              />
              <FormInput
                label={t('sale.quantity')}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="decimal-pad"
                error={quantityErr}
              />
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
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="decimal-pad"
                error={priceErr}
              />
            </>
          )}

          {receiptType === 'expense' ? (
            <FormInput
              label={t('tools.amount')}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              error={amountErr}
            />
          ) : (
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {t('tools.totalAmount')}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>₹{totalSaleAmount.toLocaleString('en-IN')}</Text>
            </View>
          )}

          <FormInput
            label={t('tools.receiptDate')}
            value={date}
            onChangeText={setDate}
            placeholder="DD/MM/YYYY"
            error={dateErr}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <FormInput
            label={t('tools.receiptSource')}
            value={source}
            onChangeText={setSource}
            placeholder={t('tools.receiptSourcePlaceholder')}
          />
          <FormInput
            label={t('common.notes')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('tools.notesPlaceholder')}
            multiline
            numberOfLines={2}
            style={{ height: 72, textAlignVertical: 'top', paddingTop: 12 }}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
            style={[styles.actionButton, { backgroundColor: isSaving ? colors.disabled : colors.primary }]}
          >
            <Text style={[styles.actionText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}> 
              {isSaving ? t('common.loading') : t('tools.saveReceipt')} 
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={[styles.backButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.backText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}> 
              {t('common.back')} 
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, marginVertical: 16 },
  heroIcon: { marginBottom: 18 },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  actionButton: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  actionText: { fontSize: 15 },
  backButton: { width: '100%', borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  backText: { fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  fieldLabel: { fontSize: 14, marginBottom: 8 },
  fieldError: { fontSize: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  summaryBox: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  summaryLabel: { fontSize: 13, marginBottom: 8 },
  summaryValue: { fontSize: 18 },
});

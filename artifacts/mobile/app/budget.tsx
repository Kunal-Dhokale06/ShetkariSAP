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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { FormInput, OptionChip, SectionHeader } from '@/components/Cards';
import { BUDGET_CATEGORIES } from '@/types';
import type { BudgetLineItem, BudgetCategory } from '@/types';

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const isValidDateStr = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);
const dateStrToISO = (s: string) => {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).toISOString();
};

export default function BudgetPlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { crops, addBudget } = useApp();

  const [selectedCropId, setSelectedCropId] = useState(crops[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [irrigationType, setIrrigationType] = useState('Drip');
  const [method, setMethod] = useState('Organic');
  const [area, setArea] = useState(crops[0]?.area.toString() ?? '');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('seeds');
  const [itemLabel, setItemLabel] = useState('Main Material');
  const [itemAmount, setItemAmount] = useState('');
  const [lineItems, setLineItems] = useState<import('@/types').BudgetLineItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [titleErr, setTitleErr] = useState('');
  const [areaErr, setAreaErr] = useState('');
  const [expectedRevenueErr, setExpectedRevenueErr] = useState('');
  const [itemAmountErr, setItemAmountErr] = useState('');

  useEffect(() => {
    if (!selectedCropId && crops.length > 0) {
      setSelectedCropId(crops[0].id);
      setArea(crops[0].area.toString());
    }
  }, [crops, selectedCropId]);

  const totalEstimatedCost = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.estimatedAmount, 0),
    [lineItems],
  );

  const expectedProfit = useMemo(() => {
    const revenue = parseFloat(expectedRevenue) || 0;
    return revenue - totalEstimatedCost;
  }, [expectedRevenue, totalEstimatedCost]);

  const roi = useMemo(() => {
    if (totalEstimatedCost <= 0) return 0;
    return Math.round((expectedProfit / totalEstimatedCost) * 100);
  }, [expectedProfit, totalEstimatedCost]);

  const addLineItem = () => {
    const amount = parseFloat(itemAmount);
    if (!itemLabel.trim() || isNaN(amount) || amount <= 0) {
      setItemAmountErr(t('validation.invalidAmount'));
      return;
    }
    setLineItems(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category,
        label: itemLabel.trim(),
        estimatedAmount: amount,
      },
    ]);
    setItemAmount('');
    setItemLabel('');
    setItemAmountErr('');
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const validate = () => {
    let ok = true;
    if (!title.trim()) { setTitleErr(t('validation.required')); ok = false; } else setTitleErr('');
    const areaNum = parseFloat(area);
    if (!area || isNaN(areaNum) || areaNum <= 0) { setAreaErr(t('validation.invalidAmount')); ok = false; } else setAreaErr('');
    const revenueNum = parseFloat(expectedRevenue);
    if (!expectedRevenue || isNaN(revenueNum) || revenueNum <= 0) { setExpectedRevenueErr(t('validation.invalidAmount')); ok = false; } else setExpectedRevenueErr('');
    if (lineItems.length === 0) {
      setItemAmountErr(t('tools.addLineItem')); ok = false;
    }
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await addBudget({
        farmId: '',
        cropId: selectedCropId,
        variety: crops.find(c => c.id === selectedCropId)?.name ?? '',
        season: crops.find(c => c.id === selectedCropId)?.season ?? 'kharif',
        area: parseFloat(area),
        irrigationType: irrigationType.trim(),
        method: method.trim(),
        title: title.trim(),
        lineItems,
        totalEstimatedCost,
        expectedRevenue: parseFloat(expectedRevenue),
        expectedProfit,
        roi,
        status: 'draft',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('tools.budgetSaved'), t('tools.budgetSavedSubtitle'));
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
        <SectionHeader title={t('tools.budgetPlanner')} />
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
            {t('tools.budgetPlanner')} 
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title={t('tools.budgetPlannerSubtitle')} />

          <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
            {t('tools.selectCrop')}
          </Text>
          <View style={styles.chipRow}>
            {crops.map(crop => (
              <OptionChip
                key={crop.id}
                label={crop.name}
                selected={selectedCropId === crop.id}
                onPress={() => setSelectedCropId(crop.id)}
              />
            ))}
          </View>

          <FormInput label={t('tools.budgetTitle')} value={title} onChangeText={setTitle} error={titleErr} />
          <FormInput label={t('tools.cropArea')} value={area} onChangeText={setArea} error={areaErr} keyboardType="decimal-pad" />
          <FormInput label={t('tools.irrigationType')} value={irrigationType} onChangeText={setIrrigationType} />
          <FormInput label={t('tools.method')} value={method} onChangeText={setMethod} />
          <FormInput label={t('tools.estimatedRevenue')} value={expectedRevenue} onChangeText={setExpectedRevenue} error={expectedRevenueErr} keyboardType="decimal-pad" />

          <View style={styles.budgetSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              {t('tools.lineItems')}
            </Text>
            <View style={styles.chipRow}>
              {BUDGET_CATEGORIES.slice(0, 8).map(cat => (
                <OptionChip
                  key={cat}
                  label={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </View>
            <FormInput
              label={t('tools.budgetItemName')}
              value={itemLabel}
              onChangeText={setItemLabel}
              placeholder={t('tools.budgetItemNamePlaceholder')}
            />
            <FormInput
              label={t('tools.amountEstimate')}
              value={itemAmount}
              onChangeText={setItemAmount}
              error={itemAmountErr}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity onPress={addLineItem} activeOpacity={0.85} style={[styles.smallButton, { backgroundColor: colors.primary }]}> 
              <Text style={[styles.smallButtonText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                {t('tools.addLineItem')}
              </Text>
            </TouchableOpacity>
            {lineItems.map(item => (
              <View key={item.id} style={[styles.lineItemRow, { borderColor: colors.border }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lineItemLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{item.label}</Text>
                  <Text style={[styles.lineItemDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {item.category} · ₹{item.estimatedAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                  <Text style={[styles.removeText, { color: colors.error, fontFamily: 'Inter_600SemiBold' }]}>
                    {t('common.delete')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={[styles.summaryRow, { borderColor: colors.border }]}> 
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('tools.totalBudget')}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>₹{totalEstimatedCost.toLocaleString('en-IN')}</Text>
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('tools.expectedProfit')}</Text>
              <Text style={[styles.summaryValue, { color: expectedProfit >= 0 ? colors.success : colors.error, fontFamily: 'Inter_700Bold' }]}>
                ₹{expectedProfit.toLocaleString('en-IN')}
              </Text>
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('tools.roi')}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {roi}%
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
            style={[styles.actionButton, { backgroundColor: isSaving ? colors.disabled : colors.primary }]}
          >
            <Text style={[styles.actionText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}> 
              {isSaving ? t('common.loading') : t('tools.saveBudget')} 
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
  fieldLabel: { fontSize: 14, marginBottom: 8 },
  fieldError: { fontSize: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  budgetSection: { marginTop: 20 },
  sectionTitle: { fontSize: 15, marginBottom: 12 },
  smallButton: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  smallButtonText: { fontSize: 14 },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
  },
  lineItemLabel: { fontSize: 14 },
  lineItemDesc: { fontSize: 12, marginTop: 4 },
  removeText: { fontSize: 13 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  summaryLabel: { fontSize: 12, marginBottom: 6 },
  summaryValue: { fontSize: 16 },
});

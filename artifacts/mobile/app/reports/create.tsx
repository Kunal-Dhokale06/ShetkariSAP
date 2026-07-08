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

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const isValidDateStr = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);
const dateStrToISO = (s: string) => {
  const [dd, mm, yyyy] = s.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).toISOString();
};

export default function ReportGeneratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { crops, expenses, sales, addReport, getCropTotals } = useApp();

  const [selectedCropId, setSelectedCropId] = useState(crops[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [titleErr, setTitleErr] = useState('');
  const [dateErr, setDateErr] = useState('');

  useEffect(() => {
    if (!selectedCropId && crops.length > 0) setSelectedCropId(crops[0].id);
  }, [crops, selectedCropId]);

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => e.cropId === selectedCropId && new Date(e.date) >= new Date(dateStrToISO(fromDate)) && new Date(e.date) <= new Date(dateStrToISO(toDate))),
    [expenses, selectedCropId, fromDate, toDate],
  );

  const filteredSales = useMemo(() =>
    sales.filter(s => s.cropId === selectedCropId && new Date(s.date) >= new Date(dateStrToISO(fromDate)) && new Date(s.date) <= new Date(dateStrToISO(toDate))),
    [sales, selectedCropId, fromDate, toDate],
  );

  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = filteredSales.reduce((sum, item) => sum + item.totalAmount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const budgetSummary = selectedCrop ? getCropTotals(selectedCrop.id) : { investment: 0, revenue: 0, netProfit: 0 };

  const validate = () => {
    let ok = true;
    if (!title.trim()) { setTitleErr(t('validation.required')); ok = false; } else setTitleErr('');
    if (!isValidDateStr(fromDate) || !isValidDateStr(toDate)) { setDateErr(t('validation.invalidDate')); ok = false; } else setDateErr('');
    return ok;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await addReport({
        title: title.trim(),
        farmId: selectedCrop?.farmId ?? null,
        cropId: selectedCropId || null,
        season: selectedCrop?.season ?? null,
        fromDate: dateStrToISO(fromDate),
        toDate: dateStrToISO(toDate),
        metadata: {
          cropName: selectedCrop?.name ?? null,
          totalExpenses,
          totalRevenue,
          netProfit,
          reportRange: `${fromDate} - ${toDate}`,
          note: notes.trim(),
          capturedAt: new Date().toISOString(),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('tools.reportSaved'), t('tools.reportSavedSubtitle'));
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
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 120 : 110 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: isWeb ? 79 : insets.top + 16 }]}> 
          <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}> 
            {t('tools.reportGenerator')} 
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title={t('tools.reportGeneratorSubtitle')} />

          <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
            {t('tools.selectReportCrop')}
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

          <FormInput label={t('tools.reportTitle')} value={title} onChangeText={setTitle} error={titleErr} />
          <FormInput label={t('tools.fromDate')} value={fromDate} onChangeText={setFromDate} error={dateErr} placeholder="DD/MM/YYYY" maxLength={10} />
          <FormInput label={t('tools.toDate')} value={toDate} onChangeText={setToDate} error={dateErr} placeholder="DD/MM/YYYY" maxLength={10} />
          <FormInput label={t('tools.notes')} value={notes} onChangeText={setNotes} placeholder={t('tools.notesPlaceholder')} multiline numberOfLines={2} style={{ height: 72, textAlignVertical: 'top', paddingTop: 12 }} />

          <View style={[styles.summaryRow, { borderColor: colors.border }]}> 
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('reports.investment')}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>{budgetSummary.investment ? `₹${budgetSummary.investment.toLocaleString('en-IN')}` : '—'}</Text>
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('reports.revenue')}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>{budgetSummary.revenue ? `₹${budgetSummary.revenue.toLocaleString('en-IN')}` : '—'}</Text>
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('reports.netProfit')}</Text>
              <Text style={[styles.summaryValue, { color: budgetSummary.netProfit >= 0 ? colors.success : colors.error, fontFamily: 'Inter_700Bold' }]}>
                {budgetSummary.netProfit ? `₹${budgetSummary.netProfit.toLocaleString('en-IN')}` : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.reportStats}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('tools.reportDateRange')}</Text>
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>{`${fromDate} → ${toDate}`}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('expense.total')}</Text>
              <Text style={[styles.statValue, { color: colors.error, fontFamily: 'Inter_700Bold' }]}>{totalExpenses ? `₹${totalExpenses.toLocaleString('en-IN')}` : '₹0'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t('sale.total')}</Text>
              <Text style={[styles.statValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>{totalRevenue ? `₹${totalRevenue.toLocaleString('en-IN')}` : '₹0'}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isSaving}
            activeOpacity={0.85}
            style={[styles.actionButton, { backgroundColor: isSaving ? colors.disabled : colors.primary }]}
          >
            <Text style={[styles.actionText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}> 
              {isSaving ? t('common.loading') : t('tools.generateReport')} 
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  summaryRow: { borderWidth: 1, borderRadius: 14, padding: 16, marginVertical: 12, flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, marginBottom: 8 },
  summaryValue: { fontSize: 16 },
  reportStats: { flexDirection: 'column', gap: 12, marginBottom: 12 },
  statBox: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  statLabel: { fontSize: 12, marginBottom: 6 },
  statValue: { fontSize: 15 },
});

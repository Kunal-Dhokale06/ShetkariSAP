import React from 'react';
import {
  Alert,
  FlatList,
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
import { EmptyState, formatCurrency, formatDateDisplay, SectionHeader, TransactionItem } from '@/components/Cards';

export default function CropDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crops, updateCrop, deleteCrop, getCropExpenses, getCropSales, getCropTotals, deleteExpense, deleteSale } = useApp();
  const isWeb = Platform.OS === 'web';

  const crop = crops.find(c => c.id === id);

  if (!crop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="leaf-outline" title={t('crop.noCrops')} />
      </View>
    );
  }

  const expenses = getCropExpenses(crop.id);
  const sales = getCropSales(crop.id);
  const totals = getCropTotals(crop.id);

  const handleDelete = () => {
    Alert.alert(t('common.confirm'), t('crop.deleteConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: async () => {
          await deleteCrop(crop.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        }
      },
    ]);
  };

  const handleMarkHarvested = () => {
    updateCrop({ ...crop, status: 'harvested' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const isProfit = totals.netProfit >= 0;

  const STATUS_COLORS: Record<string, string> = {
    active: colors.success,
    harvested: colors.info,
    failed: colors.error,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Crop Header Card */}
      <View style={[styles.cropHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.cropTitleRow}>
          <Text style={[styles.cropName, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
            {crop.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[crop.status] + '30' }]}>
            <Text style={[styles.statusText, { color: '#FFFFFF', fontFamily: 'Inter_500Medium' }]}>
              {t(`crop.${crop.status}`)}
            </Text>
          </View>
        </View>
        <Text style={[styles.cropMeta, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
          {t(`crop.${crop.season}`)} · {crop.area} {t('common.acres')}
        </Text>
        <Text style={[styles.cropMeta, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
          {t('crop.plantDate').replace(' (DD/MM/YYYY)', '')}: {formatDateDisplay(crop.plantDate)}
        </Text>
      </View>

      {/* P&L Summary */}
      <View style={styles.content}>
        <View style={[styles.plCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.plRow}>
            <PlItem label={t('crop.investment')} value={formatCurrency(totals.investment)} color={colors.error} />
            <View style={[styles.plDivider, { backgroundColor: colors.divider }]} />
            <PlItem label={t('crop.revenue')} value={formatCurrency(totals.revenue)} color={colors.success} />
          </View>
          <View style={[styles.plProfitBand, { backgroundColor: isProfit ? colors.accent : '#FFEBEE' }]}>
            <Text style={[styles.plProfitLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {isProfit ? t('common.profit') : t('common.loss')}
            </Text>
            <Text style={[styles.plProfitValue, {
              color: isProfit ? colors.success : colors.error,
              fontFamily: 'Inter_700Bold',
            }]}>
              {isProfit ? '+' : '-'}{formatCurrency(totals.netProfit)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => router.push(`/expenses/add?cropId=${crop.id}`)}
            style={[styles.actionBtn, { backgroundColor: '#FFF3E0', borderColor: '#FFB300' }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="receipt-long" size={18} color={colors.warning} />
            <Text style={[styles.actionBtnText, { color: colors.warning, fontFamily: 'Inter_500Medium' }]}>
              {t('expense.add')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/sales/add?cropId=${crop.id}`)}
            style={[styles.actionBtn, { backgroundColor: '#E3F2FD', borderColor: colors.info }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="storefront" size={18} color={colors.info} />
            <Text style={[styles.actionBtnText, { color: colors.info, fontFamily: 'Inter_500Medium' }]}>
              {t('sale.add')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mark Harvested */}
        {crop.status === 'active' && (
          <TouchableOpacity
            onPress={handleMarkHarvested}
            style={[styles.harvestBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <MaterialIcons name="agriculture" size={18} color="#FFFFFF" />
            <Text style={[styles.harvestBtnText, { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' }]}>
              {t('crop.markHarvested')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Expenses Section */}
        <SectionHeader title={`${t('crop.expenses')} (${expenses.length})`} />
        {expenses.length === 0 ? (
          <View style={[styles.emptySection, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {t('expense.noExpenses')}
            </Text>
          </View>
        ) : (
          expenses.map(exp => (
            <TransactionItem
              key={exp.id}
              type="expense"
              item={exp}
              cropName={crop.name}
              onPress={() => {}}
              onDelete={() => {
                Alert.alert(t('common.confirm'), t('common.delete') + '?', [
                  { text: t('common.no'), style: 'cancel' },
                  { text: t('common.yes'), style: 'destructive', onPress: () => deleteExpense(exp.id) },
                ]);
              }}
            />
          ))
        )}

        {/* Sales Section */}
        <SectionHeader title={`${t('crop.sales')} (${sales.length})`} />
        {sales.length === 0 ? (
          <View style={[styles.emptySection, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {t('sale.noSales')}
            </Text>
          </View>
        ) : (
          sales.map(sale => (
            <TransactionItem
              key={sale.id}
              type="sale"
              item={sale}
              cropName={crop.name}
              onPress={() => {}}
              onDelete={() => {
                Alert.alert(t('common.confirm'), t('common.delete') + '?', [
                  { text: t('common.no'), style: 'cancel' },
                  { text: t('common.yes'), style: 'destructive', onPress: () => deleteSale(sale.id) },
                ]);
              }}
            />
          ))
        )}

        {/* Notes */}
        {crop.notes ? (
          <>
            <SectionHeader title="Notes" />
            <View style={[styles.notesBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.notesText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                {crop.notes}
              </Text>
            </View>
          </>
        ) : null}

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteBtn, { borderColor: colors.error }]}
          activeOpacity={0.85}
        >
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
          <Text style={[styles.deleteBtnText, { color: colors.error, fontFamily: 'Inter_600SemiBold' }]}>
            {t('common.delete')} {t('crop.details')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function PlItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.plItem}>
      <Text style={[styles.plValue, { color, fontFamily: 'Inter_700Bold' }]}>{value}</Text>
      <Text style={[styles.plLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cropHeader: { padding: 20, paddingBottom: 24 },
  cropTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cropName: { fontSize: 24, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 52 },
  statusText: { fontSize: 12 },
  cropMeta: { fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  plCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  plRow: { flexDirection: 'row' },
  plItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  plValue: { fontSize: 17 },
  plLabel: { fontSize: 12, marginTop: 2 },
  plDivider: { width: 1, marginVertical: 12 },
  plProfitBand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  plProfitLabel: { fontSize: 12 },
  plProfitValue: { fontSize: 20 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  actionBtnText: { fontSize: 13 },
  harvestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 6, marginBottom: 20 },
  harvestBtnText: { fontSize: 14 },
  emptySection: { padding: 16, alignItems: 'center', marginBottom: 16 },
  emptySectionText: { fontSize: 13 },
  notesBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  notesText: { fontSize: 14, lineHeight: 20 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, borderWidth: 1.5, gap: 6, marginTop: 12 },
  deleteBtnText: { fontSize: 14 },
});

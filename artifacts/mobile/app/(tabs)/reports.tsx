import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { EmptyState, formatCurrency, SectionHeader } from '@/components/Cards';
import { ProfitSummary, SimpleBarChart } from '@/components/Charts';
import type { ExpenseCategory } from '@/types';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  seeds: '#4CAF50',
  fertilizer: '#8BC34A',
  pesticides: '#FF7043',
  labor: '#FF8F00',
  irrigation: '#42A5F5',
  equipment: '#7E57C2',
  transport: '#78909C',
  other: '#BDBDBD',
};

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { crops, expenses, sales, getCropTotals } = useApp();
  const isWeb = Platform.OS === 'web';

  const totalInvestment = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalProfit = totalRevenue - totalInvestment;

  const hasData = expenses.length > 0 || sales.length > 0;

  // Expense breakdown by category
  const catBreakdown = (Object.keys(CATEGORY_COLORS) as ExpenseCategory[]).map(cat => ({
    label: t(`expense.${cat}`),
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: CATEGORY_COLORS[cat],
  })).filter(d => d.value > 0);

  // Crop-wise P&L
  const cropPnL = crops.map(crop => {
    const totals = getCropTotals(crop.id);
    return { crop, ...totals };
  }).filter(c => c.investment > 0 || c.revenue > 0)
    .sort((a, b) => b.netProfit - a.netProfit);

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: isWeb ? 79 : insets.top + 16 }]}>
          <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
            {t('reports.title')}
          </Text>
        </View>
        <EmptyState
          icon="bar-chart-outline"
          title={t('reports.noData')}
          subtitle={undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: isWeb ? 79 : insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
          {t('reports.title')}
        </Text>
        <Text style={[styles.headerSub, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
          {t('reports.summary')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 120 : 110 }}
      >
        {/* P&L Summary */}
        <ProfitSummary
          investment={totalInvestment}
          revenue={totalRevenue}
          profit={totalProfit}
        />

        {/* Expense Breakdown */}
        {catBreakdown.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionHeader title={t('reports.expenseBreakdown')} />
            <SimpleBarChart
              data={catBreakdown}
              emptyText={t('common.noData')}
            />
          </View>
        )}

        {/* Crop-wise P&L */}
        {cropPnL.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionHeader title={t('reports.cropWise')} />
            {cropPnL.map(({ crop, investment, revenue, netProfit }) => {
              const isProfit = netProfit >= 0;
              return (
                <View
                  key={crop.id}
                  style={[styles.cropRow, { borderBottomColor: colors.divider }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cropName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                      {crop.name}
                    </Text>
                    <Text style={[styles.cropSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {t('common.investment')}: {formatCurrency(investment)} · {t('common.revenue')}: {formatCurrency(revenue)}
                    </Text>
                  </View>
                  <View style={[styles.profitBadge, { backgroundColor: isProfit ? '#E8F5E9' : '#FFEBEE' }]}>
                    <MaterialIcons
                      name={isProfit ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={isProfit ? colors.success : colors.error}
                    />
                    <Text style={[styles.profitText, {
                      color: isProfit ? colors.success : colors.error,
                      fontFamily: 'Inter_700Bold',
                    }]}>
                      {isProfit ? '+' : '-'}{formatCurrency(netProfit)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22 },
  headerSub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cropRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  cropName: { fontSize: 14 },
  cropSub: { fontSize: 12, marginTop: 2 },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 52,
  },
  profitText: { fontSize: 13 },
});

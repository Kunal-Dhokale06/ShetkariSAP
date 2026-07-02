import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { formatCurrency } from './Cards';

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarItem[];
  emptyText?: string;
}

export function SimpleBarChart({ data, emptyText }: SimpleBarChartProps) {
  const colors = useColors();
  const nonZero = data.filter(d => d.value > 0);
  if (nonZero.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
          {emptyText ?? 'No data'}
        </Text>
      </View>
    );
  }
  const maxValue = Math.max(...nonZero.map(d => d.value));

  return (
    <View style={styles.container}>
      {nonZero.map((item) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <View key={item.label} style={styles.row}>
            <Text
              style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <View style={[styles.trackBg, { backgroundColor: colors.secondary }]}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${pct}%` as `${number}%`,
                    backgroundColor: item.color ?? colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.value, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              {formatCurrency(item.value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Profit Summary Card ───────────────────────────────────────────────────────
interface ProfitSummaryProps {
  investment: number;
  revenue: number;
  profit: number;
}

export function ProfitSummary({ investment, revenue, profit }: ProfitSummaryProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const isProfit = profit >= 0;
  const roi = investment > 0 ? ((profit / investment) * 100).toFixed(1) : '0.0';

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.summaryRow}>
        <SummaryItem
          label={t('reports.investment')}
          value={formatCurrency(investment)}
          color={colors.error}
          icon="↓"
        />
        <View style={[styles.dividerV, { backgroundColor: colors.divider }]} />
        <SummaryItem
          label={t('reports.revenue')}
          value={formatCurrency(revenue)}
          color={colors.success}
          icon="↑"
        />
      </View>
      <View style={[styles.profitBand, { backgroundColor: isProfit ? colors.accent : '#FFEBEE' }]}>
        <View>
          <Text style={[styles.profitLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {isProfit ? t('reports.netProfit') : t('reports.netLoss')}
          </Text>
          <Text style={[styles.profitValue, {
            color: isProfit ? colors.success : colors.error,
            fontFamily: 'Inter_700Bold',
          }]}>
            {isProfit ? '+' : '-'}{formatCurrency(profit)}
          </Text>
        </View>
        <View style={[styles.roiBadge, { backgroundColor: isProfit ? colors.primary : colors.error }]}>
          <Text style={[styles.roiText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
            {isProfit ? '+' : ''}{roi}% {t('reports.roi')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SummaryItem({ label, value, color, icon }: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryIcon, { color }]}>{icon}</Text>
      <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
        {value}
      </Text>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { width: 72, fontSize: 12, marginRight: 8 },
  trackBg: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  bar: { height: 12, borderRadius: 6 },
  value: { marginLeft: 8, fontSize: 12, width: 70, textAlign: 'right' },

  summaryCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  summaryIcon: { fontSize: 18, marginBottom: 4 },
  summaryValue: { fontSize: 17 },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  dividerV: { width: 1, marginVertical: 14 },
  profitBand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  profitLabel: { fontSize: 12 },
  profitValue: { fontSize: 22, marginTop: 2 },
  roiBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 52 },
  roiText: { fontSize: 14 },
});

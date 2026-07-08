import React, { useMemo } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/components/Cards';
import { useRouter } from 'expo-router';
import type { Language, ExpenseCategory } from '@/types';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'en', label: 'English', native: 'English' },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { profile, farms, crops, expenses, sales, language, setLanguage, getCropTotals } = useApp();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  // AI Insights
  const insights = useMemo(() => {
    const list: { icon: React.ComponentProps<typeof MaterialIcons>['name']; title: string; body: string; color: string }[] = [];

    if (crops.length === 0) return list;

    // Best crop by profit
    const cropProfits = crops
      .map(crop => ({ ...getCropTotals(crop.id), name: crop.name }))
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.netProfit - a.netProfit);

    if (cropProfits.length > 0) {
      const best = cropProfits[0];
      list.push({
        icon: 'emoji-events',
        title: t('ai.bestCrop'),
        body: `${best.name}: ${best.netProfit >= 0 ? '+' : ''}${formatCurrency(best.netProfit)} ${t('ai.profit')}`,
        color: colors.success,
      });
    }

    // Biggest expense category
    const catTotals: Partial<Record<ExpenseCategory, number>> = {};
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount;
    });
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    if (Object.keys(catTotals).length > 0) {
      const [topCat, topAmt] = (Object.entries(catTotals) as [ExpenseCategory, number][])
        .sort((a, b) => b[1] - a[1])[0];
      const pct = totalExp > 0 ? Math.round((topAmt / totalExp) * 100) : 0;
      list.push({
        icon: 'pie-chart',
        title: t('ai.topExpense'),
        body: `${t(`expense.${topCat}`)}: ${formatCurrency(topAmt)} (${pct}% ${t('ai.ofTotalExpenses')})`,
        color: colors.warning,
      });
      if (pct > 40) {
        list.push({
          icon: 'lightbulb',
          title: t('ai.tip'),
          body: `${t('ai.considerReducing')} ${t(`expense.${topCat}`).toLowerCase()} ${t('ai.costs')}`,
          color: colors.info,
        });
      }
    }

    return list;
  }, [crops, expenses, getCropTotals, t, colors]);

  const handleLanguage = (lang: Language) => {
    Haptics.selectionAsync();
    setLanguage(lang);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: isWeb ? 79 : insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
          {t('tabs.more')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 120 : 110 }}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? 'K'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              {profile?.name ?? 'Farmer'}
            </Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {[profile?.village, profile?.district].filter(Boolean).join(', ') || '—'}
            </Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {farms.length} {t('dashboard.totalFarms')} · {crops.length} {t('crop.allCrops')}
            </Text>
          </View>
        </View>

        {/* Language */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="language" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              {t('language.change')}
            </Text>
          </View>
          <View style={styles.langRow}>            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguage(lang.code)}
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
                  fontFamily: language === lang.code ? 'Inter_700Bold' : 'Inter_400Regular',
                }]}>
                  {lang.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Smart Tools */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.cardHeader}>
            <MaterialIcons name="build-circle" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}> 
              {t('tools.title')} 
            </Text>
          </View>
          <View style={styles.toolGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/scan')}
              style={[styles.toolCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <MaterialIcons name="camera-alt" size={24} color={colors.success} />
              <Text style={[styles.toolLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}> {t('tools.receiptScanner')} </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/budget')}
              style={[styles.toolCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <MaterialIcons name="account-balance-wallet" size={24} color={colors.info} />
              <Text style={[styles.toolLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}> {t('tools.budgetPlanner')} </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/reports/create')}
              style={[styles.toolCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <MaterialIcons name="insert-drive-file" size={24} color={colors.warning} />
              <Text style={[styles.toolLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}> {t('tools.reportGenerator')} </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insights */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="psychology" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              {t('ai.title')}
            </Text>
          </View>
          {insights.length === 0 ? (
            <View style={styles.noInsights}>
              <Ionicons name="leaf-outline" size={32} color={colors.disabled} />
              <Text style={[styles.noInsightsText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {crops.length === 0 ? t('ai.noCropsYet') : t('ai.noInsights')}
              </Text>
            </View>
          ) : (
            insights.map((insight, i) => (
              <View key={insight.title} style={[styles.insightRow, i < insights.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
                <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                  <MaterialIcons name={insight.icon} size={20} color={insight.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    {insight.title}
                  </Text>
                  <Text style={[styles.insightBody, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {insight.body}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              {t('about.title')}
            </Text>
          </View>
          <Text style={[styles.aboutVersion, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            {t('about.version')}
          </Text>
          <Text style={[styles.aboutDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {t('about.description')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22 },
  profileName: { fontSize: 17 },
  profileSub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langNative: { fontSize: 14 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  toolCard: { flex: 1, minWidth: 100, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 10 },
  toolLabel: { fontSize: 13, textAlign: 'center' },
  noInsights: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  noInsightsText: { fontSize: 13, textAlign: 'center' },
  insightRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  insightIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 13 },
  insightBody: { fontSize: 12, marginTop: 2, lineHeight: 18 },
  aboutVersion: { fontSize: 13, marginBottom: 6 },
  aboutDesc: { fontSize: 13, lineHeight: 20 },
});

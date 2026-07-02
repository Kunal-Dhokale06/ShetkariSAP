import React from 'react';
import {
  Platform,
  Pressable,
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
import { CropCard, formatCurrency, SectionHeader, StatCard } from '@/components/Cards';
import { EmptyState } from '@/components/Cards';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, crops, farms, language, getTotals, getCropTotals } = useApp();
  const isWeb = Platform.OS === 'web';

  const totals = getTotals();
  const recentCrops = crops.slice(0, 4);

  const now = new Date();
  const locale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  const dateStr = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now);

  const handleNav = (path: '/crops/add' | '/expenses/add' | '/sales/add') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: isWeb ? 79 : insets.top + 16,
          },
        ]}
      >
        <View style={styles.headerInner}>
          <View>
            <Text style={[styles.greeting, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
              {t('dashboard.greeting')}, {weekday}
            </Text>
            <Text style={[styles.farmerName, { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
              {profile?.name ?? ''}
            </Text>
          </View>
          <View>
            <Text style={[styles.dateText, { color: colors.primaryLight, fontFamily: 'Inter_400Regular' }]}>
              {dateStr}
            </Text>
            <Text style={[styles.farmText, { color: '#FFFFFF', fontFamily: 'Inter_500Medium' }]}>
              {farms.length} {t('dashboard.totalFarms')}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 120 : 110, paddingTop: 16 }}
      >
        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label={t('dashboard.activeCrops')}
              value={String(totals.activeCrops)}
              icon="eco"
              iconColor={colors.success}
            />
            <View style={{ width: 10 }} />
            <StatCard
              label={t('dashboard.totalFarms')}
              value={String(farms.length)}
              icon="terrain"
              iconColor={colors.info}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: 10 }]}>
            <StatCard
              label={t('dashboard.totalInvestment')}
              value={formatCurrency(totals.investment)}
              icon="arrow-downward"
              iconColor={colors.error}
            />
            <View style={{ width: 10 }} />
            <StatCard
              label={t('dashboard.netPnL')}
              value={(totals.profit >= 0 ? '+' : '') + formatCurrency(totals.profit)}
              icon={totals.profit >= 0 ? 'trending-up' : 'trending-down'}
              iconColor={totals.profit >= 0 ? colors.success : colors.error}
              highlight={totals.profit >= 0}
              positive={totals.profit >= 0 ? true : false}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title={t('dashboard.quickActions')} />
          <View style={styles.actionsRow}>
            <QuickAction
              icon="eco"
              label={t('dashboard.addCrop')}
              bg="#E8F5E9"
              iconColor={colors.success}
              onPress={() => handleNav('/crops/add')}
            />
            <QuickAction
              icon="receipt-long"
              label={t('dashboard.addExpense')}
              bg="#FFF3E0"
              iconColor={colors.warning}
              onPress={() => handleNav('/expenses/add')}
            />
            <QuickAction
              icon="storefront"
              label={t('dashboard.addSale')}
              bg="#E3F2FD"
              iconColor={colors.info}
              onPress={() => handleNav('/sales/add')}
            />
          </View>
        </View>

        {/* Recent Crops */}
        <View style={styles.section}>
          <SectionHeader
            title={t('dashboard.recentCrops')}
            action={
              crops.length > 0
                ? { label: t('dashboard.viewAll'), onPress: () => router.push('/(tabs)/crops') }
                : undefined
            }
          />
          {recentCrops.length === 0 ? (
            <EmptyState
              icon="leaf-outline"
              title={t('dashboard.noCrops')}
              subtitle={t('crop.addFirst')}
              action={{ label: t('crop.add'), onPress: () => handleNav('/crops/add') }}
            />
          ) : (
            recentCrops.map(crop => {
              const totals = getCropTotals(crop.id);
              return (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  investment={totals.investment}
                  revenue={totals.revenue}
                  onPress={() => router.push(`/crops/${crop.id}`)}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon, label, bg, iconColor, onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  bg: string;
  iconColor: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={26} color={iconColor} />
      </View>
      <Text
        style={[styles.quickActionLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  greeting: { fontSize: 13 },
  farmerName: { fontSize: 22, marginTop: 2 },
  dateText: { fontSize: 12, textAlign: 'right' },
  farmText: { fontSize: 14, textAlign: 'right', marginTop: 2 },
  statsGrid: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 12, textAlign: 'center' },
});

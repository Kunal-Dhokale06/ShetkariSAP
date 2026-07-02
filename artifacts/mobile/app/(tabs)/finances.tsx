import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { EmptyState, FAB, formatCurrency, TransactionItem } from '@/components/Cards';
import type { Expense, Sale } from '@/types';

type Tab = 'expenses' | 'sales';

export default function FinancesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { crops, expenses, sales, deleteExpense, deleteSale } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const isWeb = Platform.OS === 'web';

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = sales.reduce((s, sale) => s + sale.totalAmount, 0);

  const getCropName = (cropId: string) =>
    crops.find(c => c.id === cropId)?.name ?? '—';

  const handleDeleteExpense = (id: string) => {
    Alert.alert(t('common.confirm'), t('common.delete') + '?', [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'), style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteExpense(id);
        }
      },
    ]);
  };

  const handleDeleteSale = (id: string) => {
    Alert.alert(t('common.confirm'), t('common.delete') + '?', [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'), style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteSale(id);
        }
      },
    ]);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <TransactionItem
      type="expense"
      item={item}
      cropName={getCropName(item.cropId)}
      onPress={() => {}}
      onDelete={() => handleDeleteExpense(item.id)}
    />
  );

  const renderSale = ({ item }: { item: Sale }) => (
    <TransactionItem
      type="sale"
      item={item}
      cropName={getCropName(item.cropId)}
      onPress={() => {}}
      onDelete={() => handleDeleteSale(item.id)}
    />
  );

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
        {/* Segmented control */}
        <View style={[styles.segmented, { backgroundColor: colors.primaryDark }]}>
          {(['expenses', 'sales'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.segment,
                activeTab === tab && { backgroundColor: '#FFFFFF' },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: activeTab === tab ? colors.primary : colors.primaryLight,
                    fontFamily: activeTab === tab ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  },
                ]}
              >
                {tab === 'expenses' ? t('expense.allExpenses') : t('sale.allSales')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Total Banner */}
      <View style={[styles.totalBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {activeTab === 'expenses' ? t('expense.total') : t('sale.total')}
        </Text>
        <Text style={[styles.totalValue, {
          color: activeTab === 'expenses' ? colors.error : colors.success,
          fontFamily: 'Inter_700Bold',
        }]}>
          {activeTab === 'expenses' ? '-' + formatCurrency(totalExpenses) : '+' + formatCurrency(totalSales)}
        </Text>
      </View>

      {activeTab === 'expenses' ? (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={renderExpense}
          contentContainerStyle={[styles.list, expenses.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={t('expense.noExpenses')}
              subtitle={t('expense.addFirst')}
              action={{ label: t('expense.add'), onPress: () => router.push('/expenses/add') }}
            />
          }
        />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={item => item.id}
          renderItem={renderSale}
          contentContainerStyle={[styles.list, sales.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title={t('sale.noSales')}
              subtitle={t('sale.addFirst')}
              action={{ label: t('sale.add'), onPress: () => router.push('/sales/add') }}
            />
          }
        />
      )}

      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(activeTab === 'expenses' ? '/expenses/add' : '/sales/add');
        }}
        icon="add"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 4, height: 48 },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentText: { fontSize: 13 },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 18 },
  list: { padding: 16, paddingBottom: 110 },
  listEmpty: { flex: 1 },
});

import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CropTypeIcon } from './CropTypeIcon';
import type { Crop, Expense, Sale } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────
export const formatCurrency = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const formatDateDisplay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  highlight?: boolean;
  positive?: boolean;
}

export function StatCard({ label, value, icon, iconColor, highlight, positive }: StatCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: highlight ? colors.accent : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
        <MaterialIcons name={icon} size={20} color={iconColor ?? colors.primary} />
      </View>
      <Text
        style={[styles.statValue, {
          color: positive === true ? colors.success : positive === false ? colors.error : colors.foreground,
          fontFamily: 'Inter_700Bold',
        }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Crop Card ─────────────────────────────────────────────────────────────────
const SEASON_COLORS: Record<string, string> = {
  kharif: '#FF8F00',
  rabi: '#1565C0',
  zaid: '#E91E63',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4CAF50',
  harvested: '#2196F3',
  failed: '#E53935',
};

interface CropCardProps {
  crop: Crop;
  investment: number;
  revenue: number;
  onPress: () => void;
}

export function CropCard({ crop, investment, revenue, onPress }: CropCardProps) {
  const colors = useColors();
  const profit = revenue - investment;
  const isProfit = profit >= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cropCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cropCardHeader}>
        {/* Crop type emoji icon */}
        <CropTypeIcon cropName={crop.name} size="sm" />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.cropName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {crop.name}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: SEASON_COLORS[crop.season] + '22' }]}>
              <Text style={[styles.badgeText, { color: SEASON_COLORS[crop.season], fontFamily: 'Inter_500Medium' }]}>
                {crop.season.charAt(0).toUpperCase() + crop.season.slice(1)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[crop.status] + '22', marginLeft: 6 }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[crop.status], fontFamily: 'Inter_500Medium' }]}>
                {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cropCardRight}>
          <Text style={[
            styles.cropProfit,
            { color: isProfit ? colors.success : colors.error, fontFamily: 'Inter_700Bold' },
          ]}>
            {isProfit ? '+' : '-'}{formatCurrency(profit)}
          </Text>
          <Text style={[styles.cropArea, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {crop.area} acres
          </Text>
        </View>
      </View>
      <View style={[styles.cropCardFooter, { borderTopColor: colors.divider }]}>
        <View style={styles.cropStat}>
          <MaterialIcons name="arrow-downward" size={12} color={colors.error} />
          <Text style={[styles.cropStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {formatCurrency(investment)}
          </Text>
        </View>
        <View style={styles.cropStat}>
          <MaterialIcons name="arrow-upward" size={12} color={colors.success} />
          <Text style={[styles.cropStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {formatCurrency(revenue)}
          </Text>
        </View>
        <View style={styles.cropStat}>
          <MaterialIcons name="calendar-today" size={12} color={colors.mutedForeground} />
          <Text style={[styles.cropStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {formatDateDisplay(crop.plantDate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Transaction Item ──────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  seeds: 'eco',
  fertilizer: 'science',
  pesticides: 'bug-report',
  labor: 'people',
  irrigation: 'water',
  equipment: 'build',
  transport: 'local-shipping',
  other: 'more-horiz',
};

interface TransactionItemProps {
  type: 'expense' | 'sale';
  item: Expense | Sale;
  cropName: string;
  onPress: () => void;
  onDelete: () => void;
}

export function TransactionItem({ type, item, cropName, onPress, onDelete }: TransactionItemProps) {
  const colors = useColors();
  const isExpense = type === 'expense';

  let icon: React.ComponentProps<typeof MaterialIcons>['name'] = 'receipt';
  let label = '—';
  let amount = 0;
  const date = item.date;

  if ('category' in item) {
    icon = CATEGORY_ICONS[item.category] ?? 'receipt';
    label = item.category.charAt(0).toUpperCase() + item.category.slice(1);
    amount = item.amount;
  } else {
    icon = 'storefront';
    label = item.buyerName;
    amount = item.totalAmount;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.txItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.txIcon, { backgroundColor: isExpense ? '#FFF3E0' : '#E8F5E9' }]}>
        <MaterialIcons name={icon} size={20} color={isExpense ? colors.warning : colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.txLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          {label}
        </Text>
        <Text style={[styles.txSubLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {cropName} · {formatDateDisplay(date)}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[
          styles.txAmount,
          { color: isExpense ? colors.error : colors.success, fontFamily: 'Inter_700Bold' },
        ]}>
          {isExpense ? '-' : '+'}{formatCurrency(amount)}
        </Text>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.txDelete}
        >
          <MaterialIcons name="delete-outline" size={18} color={colors.disabled} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {subtitle}
        </Text>
      ) : null}
      {action ? (
        <TouchableOpacity
          onPress={action.onPress}
          style={[styles.emptyAction, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.emptyActionText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── FAB ───────────────────────────────────────────────────────────────────────
interface FABProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  style?: object;
}

export function FAB({ onPress, icon = 'add', style }: FABProps) {
  const colors = useColors();
  const bottomOffset = Platform.OS === 'web' ? 100 : 90;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          bottom: bottomOffset,
          shadowColor: colors.primaryDark,
        },
        style,
      ]}
    >
      <MaterialIcons name={icon} size={28} color={colors.primaryForeground} />
    </TouchableOpacity>
  );
}

// ── Option Chip ───────────────────────────────────────────────────────────────
interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.secondary,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[
        styles.chipText,
        {
          color: selected ? colors.primaryForeground : colors.foreground,
          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
        },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Form Input ────────────────────────────────────────────────────────────────
import { TextInput, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormInput({ label, error, style, ...props }: FormInputProps) {
  const colors = useColors();
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
        {label}
      </Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
            color: colors.foreground,
            fontFamily: 'Inter_400Regular',
          },
          style,
        ]}
        placeholderTextColor={colors.disabled}
      />
      {error ? (
        <Text style={[styles.inputError, { color: colors.error, fontFamily: 'Inter_400Regular' }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
        {title}
      </Text>
      {action ? (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={[styles.sectionAction, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // StatCard
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 2 },

  // CropCard
  cropCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cropCardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  cropName: { fontSize: 16, marginBottom: 6 },
  badgeRow: { flexDirection: 'row' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11 },
  cropCardRight: { alignItems: 'flex-end' },
  cropProfit: { fontSize: 16 },
  cropArea: { fontSize: 12, marginTop: 2 },
  cropCardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  cropStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cropStatText: { fontSize: 12 },

  // Transaction
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  txIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: 14 },
  txSubLabel: { fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15 },
  txDelete: { marginTop: 4 },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyAction: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 52, minHeight: 52 },
  emptyActionText: { fontSize: 15 },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Chip
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 52,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 42,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13 },

  // Form Input
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, marginBottom: 6 },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputError: { fontSize: 12, marginTop: 4 },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  sectionAction: { fontSize: 13 },
});

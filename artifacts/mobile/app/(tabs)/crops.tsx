import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { CropCard, EmptyState, FAB } from '@/components/Cards';
import type { Crop } from '@/types';

export default function CropsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { crops, getCropTotals } = useApp();
  const [search, setSearch] = useState('');
  const isWeb = Platform.OS === 'web';

  const filtered = crops.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderCrop = ({ item }: { item: Crop }) => {
    const totals = getCropTotals(item.id);
    return (
      <CropCard
        crop={item}
        investment={totals.investment}
        revenue={totals.revenue}
        onPress={() => router.push(`/crops/${item.id}`)}
      />
    );
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
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.disabled} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('common.search') + '...'}
            placeholderTextColor={colors.disabled}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <MaterialIcons
              name="close"
              size={18}
              color={colors.disabled}
              onPress={() => setSearch('')}
            />
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderCrop}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title={search ? t('common.noData') : t('crop.noCrops')}
            subtitle={search ? undefined : t('crop.addFirst')}
            action={
              search
                ? undefined
                : { label: t('crop.add'), onPress: () => router.push('/crops/add') }
            }
          />
        }
      />

      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/crops/add');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginTop: 4,
  },
  searchInput: { flex: 1, fontSize: 15, height: 48 },
  list: { padding: 16, paddingBottom: 110 },
  listEmpty: { flex: 1 },
});

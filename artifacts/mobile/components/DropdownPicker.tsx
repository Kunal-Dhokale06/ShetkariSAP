import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export interface DropdownOption {
  label: string;
  value: string;
  emoji?: string;
  subtitle?: string;
}

interface DropdownPickerProps {
  label: string;
  placeholder?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  error?: string;
  disabled?: boolean;
}

export function DropdownPicker({
  label,
  placeholder = 'Select...',
  options,
  value,
  onChange,
  searchable = false,
  error,
  disabled = false,
}: DropdownPickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find(o => o.value === value);
  const filtered = query
    ? options.filter(
        o =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.subtitle?.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
        {label}
      </Text>

      <TouchableOpacity
        onPress={() => {
          if (!disabled) {
            setOpen(true);
            setQuery('');
          }
        }}
        activeOpacity={0.8}
        style={[
          styles.trigger,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: disabled ? colors.disabled + '22' : colors.card,
          },
        ]}
      >
        <View style={styles.triggerLeft}>
          {selected?.emoji ? (
            <Text style={styles.triggerEmoji}>{selected.emoji}</Text>
          ) : (
            <MaterialIcons
              name="arrow-drop-down-circle"
              size={18}
              color={selected ? colors.primary : colors.mutedForeground}
            />
          )}
          <Text
            style={[
              styles.triggerText,
              {
                fontFamily: selected ? 'Inter_500Medium' : 'Inter_400Regular',
                color: selected ? colors.foreground : colors.mutedForeground,
              },
            ]}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={22}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {!!error && (
        <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_400Regular' }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}
            >
              {label}
            </Text>
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          {searchable && (
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MaterialIcons name="search" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="Search..."
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialIcons name="cancel" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={item => item.value}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 48 }}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.optionRow,
                    { borderBottomColor: colors.divider },
                    isSelected && { backgroundColor: colors.accent },
                  ]}
                  activeOpacity={0.7}
                >
                  {item.emoji ? (
                    <Text style={styles.optionEmoji}>{item.emoji}</Text>
                  ) : (
                    <View
                      style={[
                        styles.optionDot,
                        { backgroundColor: isSelected ? colors.primary : colors.border },
                      ]}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          color: colors.foreground,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {!!item.subtitle && (
                      <Text
                        style={[
                          styles.optionSubtitle,
                          { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  triggerEmoji: { fontSize: 20 },
  triggerText: { fontSize: 15, flex: 1 },
  errorText: { fontSize: 12, marginTop: 4 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17 },
  closeBtn: { padding: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  optionEmoji: { fontSize: 24, width: 34, textAlign: 'center' },
  optionDot: { width: 10, height: 10, borderRadius: 5 },
  optionLabel: { fontSize: 15 },
  optionSubtitle: { fontSize: 12, marginTop: 2 },
});

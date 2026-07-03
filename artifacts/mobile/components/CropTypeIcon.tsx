import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { findCropData } from '@/constants/crops-data';

interface CropTypeIconProps {
  cropName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  xs: { box: 28, font: 14, radius: 8 },
  sm: { box: 36, font: 18, radius: 10 },
  md: { box: 48, font: 24, radius: 13 },
  lg: { box: 64, font: 32, radius: 18 },
};

export function CropTypeIcon({ cropName, size = 'md' }: CropTypeIconProps) {
  const crop = findCropData(cropName);
  const s = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.box,
        {
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          backgroundColor: crop.bgColor,
        },
      ]}
    >
      <Text style={{ fontSize: s.font, lineHeight: s.font + 6 }}>{crop.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface PlaceholderImageProps {
  size?: number;
  style?: any;
}

export default function PlaceholderImage({ size = 60, style }: PlaceholderImageProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Package size={size * 0.4} color={colors.gray[400]} />
      <Text style={[styles.text, { fontSize: size * 0.12 }]}>No Image</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  text: {
    color: colors.gray[500],
    fontWeight: '500',
    marginTop: 4,
  },
});

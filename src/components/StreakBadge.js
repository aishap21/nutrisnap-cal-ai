import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/api';

export default function StreakBadge({ streak, size = 'normal' }) {
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <Text style={[styles.fire, isLarge && styles.fireLarge]}>🔥</Text>
      <Text style={[styles.number, isLarge && styles.numberLarge]}>{streak}</Text>
      <Text style={[styles.label, isLarge && styles.labelLarge]}>
        {isLarge ? 'day streak' : 'days'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B0015',
    borderWidth: 1,
    borderColor: '#FF6B0040',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  fire: { fontSize: 14 },
  fireLarge: { fontSize: 22 },
  number: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF8C00',
  },
  numberLarge: { fontSize: 28, letterSpacing: -1 },
  label: {
    fontSize: 11,
    color: '#FF8C0090',
    fontWeight: '600',
  },
  labelLarge: { fontSize: 14 },
});

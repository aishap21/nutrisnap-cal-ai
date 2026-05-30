import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../constants/api';

export default function CalorieRing({ consumed, goal, size = 200 }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;
  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal;

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={over ? '#FF4D4D' : '#00E5A0'} />
            <Stop offset="100%" stopColor={over ? '#FF8C00' : '#00B4D8'} />
          </LinearGradient>
        </Defs>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx} cy={cy} r={radius}
            stroke={COLORS.bgElevated}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={cx} cy={cy} r={radius}
            stroke="url(#calGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={styles.consumed}>{consumed}</Text>
        <Text style={styles.unit}>kcal</Text>
        <Text style={styles.remaining}>
          {over ? `${consumed - goal} over` : `${remaining} left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', position: 'relative' },
  center: {
    position: 'absolute', top: 0, left: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  consumed: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -2,
  },
  unit: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: -2,
  },
  remaining: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 4,
  },
});

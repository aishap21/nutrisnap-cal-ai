import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { COLORS } from '../constants/api';

export default function FoodDetailScreen({ route, navigation }) {
  const { food } = route.params;

  const handleDelete = () => {
    Alert.alert('Remove food', `Remove "${food.foodName}" from your log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'foods', food.id));
          navigation.goBack();
        }
      }
    ]);
  };

  const MACROS = [
    { label: 'Protein', val: food.protein, unit: 'g', color: COLORS.protein, icon: '🥩' },
    { label: 'Carbs', val: food.carbs, unit: 'g', color: COLORS.carbs, icon: '🍞' },
    { label: 'Fat', val: food.fat, unit: 'g', color: COLORS.fat, icon: '🥑' },
    { label: 'Fiber', val: food.fiber || 0, unit: 'g', color: '#A78BFA', icon: '🥦' },
    { label: 'Sugar', val: food.sugar || 0, unit: 'g', color: '#F472B6', icon: '🍬' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Meal Details</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <LinearGradient colors={[COLORS.accentDim, '#0A0A0A00']} style={styles.headerCard}>
          <Text style={styles.foodName}>{food.foodName}</Text>
          <Text style={styles.servingSize}>{food.servingSize}</Text>
          <Text style={styles.date}>{food.date}</Text>
        </LinearGradient>

        {/* Calorie display */}
        <View style={styles.calCard}>
          <Text style={styles.calNumber}>{food.calories}</Text>
          <Text style={styles.calLabel}>Calories</Text>
        </View>

        {/* Macros */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutritional Breakdown</Text>
          {MACROS.map(m => (
            <View key={m.label} style={styles.macroRow}>
              <Text style={styles.macroIcon}>{m.icon}</Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={styles.macroBarTrack}>
                <View style={[styles.macroBarFill, {
                  width: `${Math.min((m.val / 100) * 100, 100)}%`,
                  backgroundColor: m.color,
                }]} />
              </View>
              <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
            </View>
          ))}
        </View>

        {/* Ingredients */}
        {food.ingredients?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingredients</Text>
            {food.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  topTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FF4D4D15', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FF4D4D30',
  },
  scroll: { padding: 16 },
  headerCard: { borderRadius: 20, padding: 24, marginBottom: 12 },
  foodName: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8, marginBottom: 6 },
  servingSize: { fontSize: 15, color: COLORS.textSub, marginBottom: 4 },
  date: { fontSize: 12, color: COLORS.textMuted },
  calCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 28,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.accentGlow,
  },
  calNumber: { fontSize: 64, fontWeight: '900', color: COLORS.accent, letterSpacing: -3 },
  calLabel: { fontSize: 14, color: COLORS.textSub, fontWeight: '600', letterSpacing: 2, marginTop: -4 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  macroIcon: { fontSize: 18, width: 24 },
  macroLabel: { width: 52, fontSize: 13, color: COLORS.textSub, fontWeight: '600' },
  macroBarTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.bgElevated,
    borderRadius: 4, overflow: 'hidden',
  },
  macroBarFill: { height: '100%', borderRadius: 4 },
  macroVal: { width: 36, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  ingredientText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
});

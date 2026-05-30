import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, StatusBar, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../constants/firebase';
import { COLORS, DAILY_GOALS } from '../constants/api';
import CalorieRing from '../components/CalorieRing';
import MacroRing from '../components/MacroRing';
import StreakBadge from '../components/StreakBadge';

export default function HomeScreen({ navigation }) {
  const [todayFoods, setTodayFoods] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toDateString();

  useEffect(() => {
    // Load user profile
    const loadProfile = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setUserProfile(snap.data());
    };
    loadProfile();

    // Listen to today's foods
    const q = query(
      collection(db, 'foods'),
      where('userId', '==', auth.currentUser.uid),
      where('date', '==', today)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const foods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodayFoods(foods);
    });
    return unsub;
  }, []);

  const goals = {
    calories: userProfile?.calorieGoal ?? DAILY_GOALS.calories,
    protein: userProfile?.proteinGoal ?? DAILY_GOALS.protein,
    carbs: userProfile?.carbsGoal ?? DAILY_GOALS.carbs,
    fat: userProfile?.fatGoal ?? DAILY_GOALS.fat,
  };

  const totals = todayFoods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      protein: acc.protein + (f.protein || 0),
      carbs: acc.carbs + (f.carbs || 0),
      fat: acc.fat + (f.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const deleteFood = async (id) => {
    await deleteDoc(doc(db, 'foods', id));
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={COLORS.accent} />}
      >
        {/* Header */}
        <LinearGradient
          colors={['#00E5A012', '#0A0A0A00']}
          style={styles.headerGrad}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.headerName}>
                {userProfile?.name?.split(' ')[0] || 'there'} 👋
              </Text>
            </View>
            <StreakBadge streak={userProfile?.streak ?? 0} />
          </View>
        </LinearGradient>

        {/* Calorie Ring */}
        <View style={styles.ringSection}>
          <CalorieRing consumed={totals.calories} goal={goals.calories} size={210} />
          <View style={styles.ringMeta}>
            <View style={styles.ringMetaItem}>
              <Text style={styles.ringMetaVal}>{goals.calories}</Text>
              <Text style={styles.ringMetaLabel}>Goal</Text>
            </View>
            <View style={styles.ringMetaSep} />
            <View style={styles.ringMetaItem}>
              <Text style={styles.ringMetaVal}>{totals.calories}</Text>
              <Text style={styles.ringMetaLabel}>Eaten</Text>
            </View>
            <View style={styles.ringMetaSep} />
            <View style={styles.ringMetaItem}>
              <Text style={[styles.ringMetaVal, { color: COLORS.accent }]}>
                {Math.max(goals.calories - totals.calories, 0)}
              </Text>
              <Text style={styles.ringMetaLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Macro Rings */}
        <View style={styles.macroCard}>
          <Text style={styles.sectionTitle}>Macros</Text>
          <View style={styles.macroRow}>
            <MacroRing label="Protein" value={totals.protein} goal={goals.protein} color={COLORS.protein} size={90} />
            <MacroRing label="Carbs" value={totals.carbs} goal={goals.carbs} color={COLORS.carbs} size={90} />
            <MacroRing label="Fat" value={totals.fat} goal={goals.fat} color={COLORS.fat} size={90} />
          </View>
          {/* Macro bar breakdown */}
          <View style={styles.macroBarSection}>
            {[
              { label: 'Protein', val: totals.protein, goal: goals.protein, color: COLORS.protein },
              { label: 'Carbs', val: totals.carbs, goal: goals.carbs, color: COLORS.carbs },
              { label: 'Fat', val: totals.fat, goal: goals.fat, color: COLORS.fat },
            ].map(m => (
              <View key={m.label} style={styles.macroBarRow}>
                <Text style={styles.macroBarLabel}>{m.label}</Text>
                <View style={styles.macroBarTrack}>
                  <View
                    style={[
                      styles.macroBarFill,
                      { width: `${Math.min((m.val / m.goal) * 100, 100)}%`, backgroundColor: m.color }
                    ]}
                  />
                </View>
                <Text style={styles.macroBarVal}>{m.val}g / {m.goal}g</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Log */}
        <View style={styles.logSection}>
          <View style={styles.logHeader}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            <Text style={styles.logCount}>{todayFoods.length} items</Text>
          </View>

          {todayFoods.length === 0 ? (
            <View style={styles.emptyLog}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>Nothing logged yet</Text>
              <Text style={styles.emptySub}>Snap a photo of your meal to get started</Text>
            </View>
          ) : (
            todayFoods.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodItem}
                onPress={() => navigation.navigate('FoodDetail', { food: item })}
                onLongPress={() => deleteFood(item.id)}
              >
                <View style={styles.foodIcon}>
                  <Text style={styles.foodIconText}>🍴</Text>
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.foodName}</Text>
                  <Text style={styles.foodServing}>{item.servingSize}</Text>
                </View>
                <View style={styles.foodMacros}>
                  <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                  <Text style={styles.foodMacroText}>
                    P{item.protein}·C{item.carbs}·F{item.fat}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerGrad: { paddingTop: 56, paddingBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 24,
  },
  greeting: { fontSize: 13, color: COLORS.textSub, fontWeight: '600', letterSpacing: 0.5 },
  headerName: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  ringSection: { alignItems: 'center', paddingVertical: 28 },
  ringMeta: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 20, gap: 0,
  },
  ringMetaItem: { alignItems: 'center', paddingHorizontal: 20 },
  ringMetaVal: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  ringMetaLabel: { fontSize: 11, color: COLORS.textSub, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  ringMetaSep: { width: 1, height: 32, backgroundColor: COLORS.border },
  macroCard: {
    marginHorizontal: 16, backgroundColor: COLORS.bgCard,
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3, marginBottom: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  macroBarSection: { gap: 12 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroBarLabel: { width: 50, fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  macroBarTrack: {
    flex: 1, height: 6, backgroundColor: COLORS.bgElevated,
    borderRadius: 3, overflow: 'hidden',
  },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroBarVal: { width: 70, fontSize: 11, color: COLORS.textSub, textAlign: 'right' },
  logSection: { marginHorizontal: 16 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logCount: { fontSize: 13, color: COLORS.textSub, fontWeight: '600' },
  emptyLog: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSub, textAlign: 'center' },
  foodItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  foodIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  foodIconText: { fontSize: 18 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  foodServing: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  foodMacros: { alignItems: 'flex-end' },
  foodCalories: { fontSize: 15, fontWeight: '800', color: COLORS.accent },
  foodMacroText: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, StatusBar, ScrollView, Dimensions
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../constants/firebase';
import { COLORS } from '../constants/api';

const SCREEN_W = Dimensions.get('window').width;

function WeeklyChart({ data, goal }) {
  const maxVal = Math.max(...data.map(d => d.calories), goal, 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.bars}>
        {data.map((d, i) => {
          const height = Math.max((d.calories / maxVal) * 120, 4);
          const isToday = i === today;
          const isOver = d.calories > goal;
          return (
            <View key={i} style={chartStyles.barWrapper}>
              <Text style={chartStyles.barVal}>{d.calories > 0 ? d.calories : ''}</Text>
              <View style={chartStyles.barTrack}>
                {/* Goal line indicator */}
                <View style={[chartStyles.goalLine, { bottom: (goal / maxVal) * 120 }]} />
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height,
                      backgroundColor: isOver ? COLORS.danger : isToday ? COLORS.accent : '#2A3A32',
                    }
                  ]}
                />
              </View>
              <Text style={[chartStyles.dayLabel, isToday && { color: COLORS.accent }]}>
                {days[i]}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.accent }]} />
          <Text style={chartStyles.legendText}>Today</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#2A3A32' }]} />
          <Text style={chartStyles.legendText}>Past days</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.danger }]} />
          <Text style={chartStyles.legendText}>Over goal</Text>
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { paddingTop: 16 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 6, paddingBottom: 24 },
  barWrapper: { flex: 1, alignItems: 'center', position: 'relative' },
  barTrack: { width: '100%', height: 120, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  goalLine: {
    position: 'absolute', left: -4, right: -4, height: 1.5,
    backgroundColor: '#FFFFFF20', borderRadius: 1,
  },
  barVal: { fontSize: 8, color: COLORS.textSub, marginBottom: 2, textAlign: 'center' },
  dayLabel: { fontSize: 11, color: COLORS.textSub, fontWeight: '700', marginTop: 6 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSub },
});

export default function HistoryScreen() {
  const [foods, setFoods] = useState([]);
  const [weeklyData, setWeeklyData] = useState(Array(7).fill({ calories: 0 }));
  const [weeklyTotals, setWeeklyTotals] = useState({ cal: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const q = query(
      collection(db, 'foods'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFoods(data);

      // Build 7-day chart data
      const dayMap = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap[d.toDateString()] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      data.forEach(f => {
        if (dayMap[f.date] !== undefined) {
          dayMap[f.date].calories += f.calories || 0;
          dayMap[f.date].protein += f.protein || 0;
          dayMap[f.date].carbs += f.carbs || 0;
          dayMap[f.date].fat += f.fat || 0;
        }
      });

      const week = Object.values(dayMap);
      // Reorder to start from Sunday of current week
      const todayDow = new Date().getDay();
      const ordered = [];
      for (let i = 0; i < 7; i++) {
        // get day-of-week index from week array
        const idx = (i - (6 - todayDow) + 7) % 7;
        ordered[i] = week[idx] || { calories: 0 };
      }
      setWeeklyData(ordered);

      // Weekly totals (last 7 days)
      const totals = week.reduce((acc, d) => ({
        cal: acc.cal + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fat: acc.fat + d.fat,
      }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
      setWeeklyTotals(totals);
    });
    return unsub;
  }, []);

 
  const grouped = foods.reduce((acc, food) => {
    if (!acc[food.date]) acc[food.date] = [];
    acc[food.date].push(food);
    return acc;
  }, {});
  const groupedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>History</Text>
        <Text style={styles.topSub}>Your nutrition over time</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Weekly chart card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <WeeklyChart data={weeklyData} goal={2000} />
          <View style={styles.weekStats}>
            {[
              { label: 'Avg Cal', val: Math.round(weeklyTotals.cal / 7), unit: 'kcal', color: COLORS.accent },
              { label: 'Protein', val: Math.round(weeklyTotals.protein / 7), unit: 'g', color: COLORS.protein },
              { label: 'Carbs', val: Math.round(weeklyTotals.carbs / 7), unit: 'g', color: COLORS.carbs },
              { label: 'Fat', val: Math.round(weeklyTotals.fat / 7), unit: 'g', color: COLORS.fat },
            ].map(s => (
              <View key={s.label} style={styles.weekStat}>
                <Text style={[styles.weekStatVal, { color: s.color }]}>{s.val}{s.unit}</Text>
                <Text style={styles.weekStatLabel}>{s.label}/day</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daily log groups */}
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Daily Logs</Text>
          {groupedDates.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No history yet.</Text>
              <Text style={styles.emptySub}>Start logging meals to see your history!</Text>
            </View>
          ) : groupedDates.map(date => {
            const dayFoods = grouped[date];
            const dayTotal = dayFoods.reduce((s, f) => s + (f.calories || 0), 0);
            const isToday = date === new Date().toDateString();
            return (
              <View key={date} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayDate}>{isToday ? 'Today' : date}</Text>
                    <Text style={styles.dayCount}>{dayFoods.length} items</Text>
                  </View>
                  <View style={styles.dayTotalBox}>
                    <Text style={styles.dayTotal}>{dayTotal}</Text>
                    <Text style={styles.dayTotalLabel}>kcal</Text>
                  </View>
                </View>
                {dayFoods.map(food => (
                  <View key={food.id} style={styles.foodRow}>
                    <View style={styles.foodIcon}>
                      <Ionicons name="fast-food" size={14} color={COLORS.textSub} />
                    </View>
                    <Text style={styles.foodName} numberOfLines={1}>{food.foodName}</Text>
                    <Text style={styles.foodCal}>{food.calories} kcal</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  topTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  topSub: { fontSize: 13, color: COLORS.textSub, marginTop: 3 },
  card: {
    marginHorizontal: 16, backgroundColor: COLORS.bgCard, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  weekStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  weekStat: { alignItems: 'center' },
  weekStatVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  weekStatLabel: { fontSize: 10, color: COLORS.textSub, fontWeight: '600', marginTop: 2 },
  logSection: { marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  dayGroup: {
    backgroundColor: COLORS.bgCard, borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
  },
  dayDate: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  dayCount: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  dayTotalBox: { alignItems: 'flex-end' },
  dayTotal: { fontSize: 20, fontWeight: '900', color: COLORS.accent, letterSpacing: -0.5 },
  dayTotalLabel: { fontSize: 10, color: COLORS.textSub, fontWeight: '600' },
  foodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  foodIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.bgElevated, justifyContent: 'center', alignItems: 'center',
  },
  foodName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  foodCal: { fontSize: 14, color: COLORS.textSub, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textSub, marginTop: 6, textAlign: 'center' },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebase';
import { COLORS } from '../constants/api';

const GOALS = [
  { key: 'lose', label: 'Lose Weight', emoji: '🔥', cal: 1600, p: 130, c: 160, f: 50 },
  { key: 'maintain', label: 'Maintain Weight', emoji: '⚖️', cal: 2000, p: 150, c: 200, f: 65 },
  { key: 'gain', label: 'Build Muscle', emoji: '💪', cal: 2600, p: 190, c: 280, f: 75 },
];

const ACTIVITY = [
  { key: 'sedentary', label: 'Sedentary', sub: 'Little or no exercise', mult: 1.0 },
  { key: 'light', label: 'Lightly Active', sub: '1–3 days/week', mult: 1.1 },
  { key: 'moderate', label: 'Moderately Active', sub: '3–5 days/week', mult: 1.2 },
  { key: 'very', label: 'Very Active', sub: '6–7 days/week', mult: 1.35 },
];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!selectedGoal || !selectedActivity) return;
    setLoading(true);
    try {
      const goal = GOALS.find(g => g.key === selectedGoal);
      const activity = ACTIVITY.find(a => a.key === selectedActivity);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        calorieGoal: Math.round(goal.cal * activity.mult),
        proteinGoal: goal.p,
        carbsGoal: goal.c,
        fatGoal: goal.f,
        goal: selectedGoal,
        activity: selectedActivity,
        onboarded: true,
      });
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Error', 'Could not save your goals.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00E5A010', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
      />

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {[0, 1].map(i => (
          <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <>
            <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.sub}>We'll customize your daily targets.</Text>
            <View style={styles.options}>
              {GOALS.map(g => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.card, selectedGoal === g.key && styles.cardActive]}
                  onPress={() => setSelectedGoal(g.key)}
                >
                  <Text style={styles.cardEmoji}>{g.emoji}</Text>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardLabel, selectedGoal === g.key && styles.cardLabelActive]}>
                      {g.label}
                    </Text>
                    <Text style={styles.cardSub}>{g.cal} kcal · {g.p}g protein</Text>
                  </View>
                  <View style={[styles.radio, selectedGoal === g.key && styles.radioActive]}>
                    {selectedGoal === g.key && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedGoal && styles.nextBtnDisabled]}
              onPress={() => selectedGoal && setStep(1)}
            >
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
            <Text style={styles.title}>Activity level?</Text>
            <Text style={styles.sub}>Helps us calculate your true calorie needs.</Text>
            <View style={styles.options}>
              {ACTIVITY.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.card, selectedActivity === a.key && styles.cardActive]}
                  onPress={() => setSelectedActivity(a.key)}
                >
                  <View style={styles.cardText}>
                    <Text style={[styles.cardLabel, selectedActivity === a.key && styles.cardLabelActive]}>
                      {a.label}
                    </Text>
                    <Text style={styles.cardSub}>{a.sub}</Text>
                  </View>
                  <View style={[styles.radio, selectedActivity === a.key && styles.radioActive]}>
                    {selectedActivity === a.key && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, styles.nextBtnFlex, (!selectedActivity || loading) && styles.nextBtnDisabled]}
                onPress={handleFinish}
                disabled={!selectedActivity || loading}
              >
                {loading
                  ? <ActivityIndicator color="#0A0A0A" />
                  : <Text style={styles.nextBtnText}>Let's Go 🚀</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  progressRow: { flexDirection: 'row', gap: 8, padding: 24, paddingTop: 60 },
  dot: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.bgElevated,
  },
  dotActive: { backgroundColor: COLORS.accent },
  scroll: { padding: 24 },
  stepLabel: {
    fontSize: 11, color: COLORS.accent, fontWeight: '800',
    letterSpacing: 2, marginBottom: 12,
  },
  title: { fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -1, marginBottom: 8 },
  sub: { fontSize: 15, color: COLORS.textSub, marginBottom: 28 },
  options: { gap: 12, marginBottom: 28 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.bgCard, borderRadius: 16,
    padding: 18, borderWidth: 1.5, borderColor: COLORS.border,
  },
  cardActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentDim },
  cardEmoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardLabelActive: { color: COLORS.accent },
  cardSub: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.textMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  btnRow: { flexDirection: 'row', gap: 12 },
  nextBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  nextBtnFlex: { flex: 1 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
  backBtn: {
    backgroundColor: COLORS.bgCard, borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 20,
  },
  backBtnText: { color: COLORS.textSub, fontSize: 16, fontWeight: '700' },
});

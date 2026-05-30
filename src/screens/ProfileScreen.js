import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Alert, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../constants/firebase';
import { COLORS } from '../constants/api';
import StreakBadge from '../components/StreakBadge';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      setProfile(data);
      setCalorieGoal(String(data.calorieGoal || 2000));
      setProteinGoal(String(data.proteinGoal || 150));
    }
  };

  const saveGoals = async () => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        calorieGoal: parseInt(calorieGoal) || 2000,
        proteinGoal: parseInt(proteinGoal) || 150,
      });
      setEditing(false);
      loadProfile();
      Alert.alert('✅ Saved', 'Your goals have been updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save goals.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const STAT_ROWS = [
    { icon: 'flame', label: 'Daily Calorie Goal', val: `${profile?.calorieGoal ?? 2000} kcal`, color: COLORS.accent },
    { icon: 'barbell', label: 'Protein Goal', val: `${profile?.proteinGoal ?? 150}g`, color: COLORS.protein },
    { icon: 'nutrition', label: 'Carbs Goal', val: `${profile?.carbsGoal ?? 200}g`, color: COLORS.carbs },
    { icon: 'water', label: 'Fat Goal', val: `${profile?.fatGoal ?? 65}g`, color: COLORS.fat },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + name section */}
        <LinearGradient
          colors={[COLORS.accentDim, '#0A0A0A00']}
          style={styles.heroGrad}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.heroName}>{profile?.name ?? 'Athlete'}</Text>
          <Text style={styles.heroEmail}>{auth.currentUser?.email}</Text>
          <View style={{ marginTop: 12 }}>
            <StreakBadge streak={profile?.streak ?? 0} size="large" />
          </View>
        </LinearGradient>

        {/* Goals card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Goals</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={styles.editBtn}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Calorie Goal</Text>
                <TextInput
                  style={styles.editInput}
                  value={calorieGoal}
                  onChangeText={setCalorieGoal}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Protein Goal (g)</Text>
                <TextInput
                  style={styles.editInput}
                  value={proteinGoal}
                  onChangeText={setProteinGoal}
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={saveGoals}>
                <Text style={styles.saveBtnText}>Save Goals</Text>
              </TouchableOpacity>
            </View>
          ) : (
            STAT_ROWS.map(row => (
              <View key={row.label} style={styles.statRow}>
                <View style={[styles.statIcon, { backgroundColor: row.color + '20' }]}>
                  <Ionicons name={row.icon} size={18} color={row.color} />
                </View>
                <Text style={styles.statLabel}>{row.label}</Text>
                <Text style={[styles.statVal, { color: row.color }]}>{row.val}</Text>
              </View>
            ))
          )}
        </View>

        {/* App settings card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Ionicons name="settings" size={20} color={COLORS.textSub} />
            <Text style={styles.settingLabel}>Reconfigure Goals</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color={COLORS.danger} />
            <Text style={[styles.settingLabel, { color: COLORS.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>NutriSnap v1.0</Text>
          <Text style={styles.appInfoText}>Powered by Claude AI</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 0 },
  topTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  heroGrad: { alignItems: 'center', padding: 28, paddingTop: 24, marginBottom: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accentDim, borderWidth: 2, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.accent },
  heroName: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  heroEmail: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },
  card: {
    marginHorizontal: 16, backgroundColor: COLORS.bgCard, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  editBtn: { fontSize: 14, color: COLORS.accent, fontWeight: '700' },
  statRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  statLabel: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  statVal: { fontSize: 14, fontWeight: '800' },
  editForm: { gap: 14 },
  editRow: { gap: 8 },
  editLabel: { fontSize: 12, color: COLORS.textSub, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  editInput: {
    backgroundColor: COLORS.bgElevated, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 15 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  settingLabel: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border },
  appInfo: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  appInfoText: { fontSize: 12, color: COLORS.textMuted },
});

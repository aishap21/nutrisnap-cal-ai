import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebase';
import { COLORS } from '../constants/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Create user profile doc
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email: email.trim(),
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 200,
        fatGoal: 65,
        streak: 0,
        lastLogDate: null,
        createdAt: new Date(),
      });
    } catch (error) {
      const msg = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : error.message;
      Alert.alert('Signup Failed', msg);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00E5A015', '#0A0A0A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>⚡</Text>
            </View>
            <Text style={styles.appName}>NutriSnap</Text>
            <Text style={styles.tagline}>Start your nutrition journey</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Create account</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#0A0A0A" />
                : <Text style={styles.buttonText}>Create Account</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Text style={[styles.linkText, styles.linkAccent]}>Sign in →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 16 },
  header: { marginBottom: 16 },
  backBtn: { padding: 4 },
  backText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1, borderColor: COLORS.accentGlow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  logoEmoji: { fontSize: 32 },
  appName: { fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
  tagline: { fontSize: 14, color: COLORS.textSub, marginTop: 4 },
  form: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 24, letterSpacing: -0.5 },
  inputWrapper: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12, color: COLORS.textSub, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgElevated, borderRadius: 12, padding: 14,
    color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.accent, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
  },
  buttonText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { color: COLORS.textSub, fontSize: 14 },
  linkAccent: { color: COLORS.accent, fontWeight: '700' },
});

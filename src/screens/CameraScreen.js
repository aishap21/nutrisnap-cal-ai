import { OPENROUTER_API_KEY, OPENROUTER_MODEL, COLORS } from '../constants/api';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView,
  StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../constants/firebase';

const LOADING_MESSAGES = [
  '🔍 Identifying your meal...',
  '📊 Calculating macros...',
  '🧠 Running nutrition analysis...',
  '✅ Almost ready...',
];

export default function CameraScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeFood = async () => {
    if (!image) return;
    setLoading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    try {
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              },
              {
                type: 'text',
                text: `Analyze this food image. Return ONLY a valid JSON object with exactly these fields:
{
  "foodName": "descriptive name of the food",
  "servingSize": "estimated serving description (e.g. 1 cup, 200g, 1 medium plate)",
  "calories": 350,
  "protein": 25,
  "carbs": 40,
  "fat": 8,
  "fiber": 5,
  "sugar": 12,
  "confidence": "high|medium|low",
  "ingredients": ["main ingredient 1", "main ingredient 2", "main ingredient 3"]
}
All numeric values must be integers. No markdown, no extra text, just the JSON.`
              }
            ]
          }]
        }),
      });

      clearInterval(interval);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid JSON');
      const parsed = JSON.parse(jsonMatch[0]);
      setResult(parsed);
    } catch (error) {
      clearInterval(interval);
      Alert.alert('Analysis Failed', 'Could not analyze the food. Please try a clearer photo.');
    }
    setLoading(false);
  };

  const saveToLog = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'foods'), {
        foodName: result.foodName,
        servingSize: result.servingSize,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber || 0,
        sugar: result.sugar || 0,
        ingredients: result.ingredients || [],
        userId: auth.currentUser.uid,
        date: new Date().toDateString(),
        createdAt: new Date(),
      });

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const lastLog = userData.lastLogDate;
        const todayStr = new Date().toDateString();
        const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
        let streak = userData.streak || 0;
        if (lastLog === yesterdayStr) streak += 1;
        else if (lastLog !== todayStr) streak = 1;
        await updateDoc(userRef, { streak, lastLogDate: todayStr });
      }

      Alert.alert('✅ Saved!', `${result.foodName} added to your log.`, [
        { text: 'Done', onPress: () => { setImage(null); setResult(null); navigation.navigate('Home'); } }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not save food.');
    }
    setSaving(false);
  };

  const confidenceColor = (c) => {
    if (c === 'high') return '#00E5A0';
    if (c === 'medium') return '#FFD93D';
    return '#FF6B6B';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Snap a Meal</Text>
        <Text style={styles.topSub}>AI-powered nutrition analysis</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!image ? (
          <View style={styles.uploadArea}>
            <LinearGradient
              colors={[COLORS.accentDim, '#0A0A0A00']}
              style={styles.uploadGrad}
            />
            <View style={styles.uploadIconCircle}>
              <Ionicons name="camera" size={40} color={COLORS.accent} />
            </View>
            <Text style={styles.uploadTitle}>Photograph your food</Text>
            <Text style={styles.uploadSub}>
              Take a clear photo or pick from your gallery for the most accurate results
            </Text>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={22} color={COLORS.accent} />
                <Text style={styles.uploadBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnSecondary]} onPress={pickImage}>
                <Ionicons name="images" size={22} color={COLORS.textSub} />
                <Text style={[styles.uploadBtnText, { color: COLORS.textSub }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity style={styles.retakeBtn} onPress={() => { setImage(null); setResult(null); }}>
                <Ionicons name="refresh" size={18} color={COLORS.text} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>

            {!loading && !result && (
              <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeFood}>
                <LinearGradient
                  colors={[COLORS.accent, '#00B4D8']}
                  style={styles.analyzeBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="flash" size={22} color="#0A0A0A" />
                  <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {loading && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>{LOADING_MESSAGES[loadingStep]}</Text>
                <Text style={styles.loadingSub}>Powered by AI Vision</Text>
              </View>
            )}

            {result && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleRow}>
                    <Text style={styles.resultFoodName}>{result.foodName}</Text>
                    {result.confidence && (
                      <View style={[styles.confidenceBadge, { borderColor: confidenceColor(result.confidence) }]}>
                        <Text style={[styles.confidenceText, { color: confidenceColor(result.confidence) }]}>
                          {result.confidence}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.resultServing}>{result.servingSize}</Text>
                </View>

                <View style={styles.calorieHighlight}>
                  <Text style={styles.calorieNumber}>{result.calories}</Text>
                  <Text style={styles.calorieUnit}>calories</Text>
                </View>

                <View style={styles.macroGrid}>
                  {[
                    { label: 'Protein', val: result.protein, unit: 'g', color: COLORS.protein },
                    { label: 'Carbs', val: result.carbs, unit: 'g', color: COLORS.carbs },
                    { label: 'Fat', val: result.fat, unit: 'g', color: COLORS.fat },
                    { label: 'Fiber', val: result.fiber || 0, unit: 'g', color: '#A78BFA' },
                    { label: 'Sugar', val: result.sugar || 0, unit: 'g', color: '#F472B6' },
                  ].map(m => (
                    <View key={m.label} style={styles.macroCell}>
                      <Text style={[styles.macroCellVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                      <Text style={styles.macroCellLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>

                {result.ingredients?.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <Text style={styles.ingredientsTitle}>Main Ingredients</Text>
                    <View style={styles.ingredientChips}>
                      {result.ingredients.map((ing, i) => (
                        <View key={i} style={styles.chip}>
                          <Text style={styles.chipText}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={saveToLog} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color={COLORS.bg} />
                    : <>
                        <Ionicons name="add-circle" size={22} color={COLORS.bg} />
                        <Text style={styles.saveBtnText}>Add to My Log</Text>
                      </>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={styles.tryAgainBtn} onPress={() => setResult(null)}>
                  <Text style={styles.tryAgainText}>Try different photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  topTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  topSub: { fontSize: 13, color: COLORS.textSub, marginTop: 3 },
  scroll: { padding: 16, paddingBottom: 48 },
  uploadArea: {
    borderRadius: 24, overflow: 'hidden', borderWidth: 1.5,
    borderColor: COLORS.accentGlow, borderStyle: 'dashed',
    padding: 40, alignItems: 'center', position: 'relative', marginBottom: 16,
  },
  uploadGrad: { ...StyleSheet.absoluteFillObject },
  uploadIconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.accentDim, borderWidth: 1, borderColor: COLORS.accentGlow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  uploadTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  uploadSub: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  uploadButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.accentDim, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.accentGlow,
  },
  uploadBtnSecondary: { backgroundColor: COLORS.bgCard, borderColor: COLORS.border },
  uploadBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  imageWrapper: { marginBottom: 16, position: 'relative' },
  image: { width: '100%', height: 240, borderRadius: 20 },
  retakeBtn: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#00000080', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  retakeBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  analyzeBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  analyzeBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 18,
  },
  analyzeBtnText: { fontSize: 17, fontWeight: '800', color: '#0A0A0A' },
  loadingCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 36,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  loadingText: { fontSize: 16, color: COLORS.text, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  loadingSub: { fontSize: 12, color: COLORS.textSub, marginTop: 6 },
  resultCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  resultHeader: { marginBottom: 16 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  resultFoodName: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5, flex: 1 },
  confidenceBadge: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  confidenceText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  resultServing: { fontSize: 13, color: COLORS.textSub },
  calorieHighlight: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    backgroundColor: COLORS.accentDim, borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.accentGlow,
  },
  calorieNumber: { fontSize: 48, fontWeight: '900', color: COLORS.accent, letterSpacing: -2 },
  calorieUnit: { fontSize: 16, color: COLORS.accent, fontWeight: '600', opacity: 0.7 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  macroCell: {
    flex: 1, minWidth: '18%', backgroundColor: COLORS.bgElevated,
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  macroCellVal: { fontSize: 16, fontWeight: '800' },
  macroCellLabel: { fontSize: 10, color: COLORS.textSub, fontWeight: '600', marginTop: 3, letterSpacing: 0.5 },
  ingredientsSection: { marginBottom: 16 },
  ingredientsTitle: { fontSize: 12, color: COLORS.textSub, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  ingredientChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: COLORS.bgElevated, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 10,
  },
  saveBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
  tryAgainBtn: { alignItems: 'center', padding: 8 },
  tryAgainText: { color: COLORS.textSub, fontSize: 14, fontWeight: '600' },
});
# ⚡ NutriSnap — AI Calorie Tracker

> Cal AI Clone built with React Native (Expo) + Claude Vision AI + Firebase

---

## 📱 Features

- **📸 AI Food Recognition** — Snap a photo, get instant calorie + macro breakdown powered by Claude Vision
- **📊 Macro Progress Rings** — Animated SVG rings for Protein, Carbs & Fat
- **🍩 Calorie Donut Ring** — Live gradient ring showing daily calorie progress
- **📅 Daily Food Diary** — Running log with food items, tap to view details
- **📈 Weekly History Chart** — 7-day calorie bar chart with daily averages
- **🔥 Streak Tracking** — Auto-tracks consecutive logging days
- **🎯 Personalized Goals** — Onboarding flow sets calorie/macro targets
- **👤 Profile Screen** — Edit goals, reconfigure, sign out
- **🔐 Firebase Auth** — Email/password sign in & sign up

---

## 🚀 Quick Start

### 1. Clone or download

```bash
git clone <your-repo> nutrisnap
cd nutrisnap
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in test mode)
5. Copy your config to `src/constants/firebase.js`

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Add your Claude API key

Edit `src/constants/api.js`:

```js
export const CLAUDE_API_KEY = "sk-ant-api03-YOUR-KEY-HERE";
```

Get a key at: https://console.anthropic.com

### 4. Run it

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.

---

## 📁 Project Structure

```
CalAIClone/
├── App.js                    # Root navigation + auth state
├── app.json                  # Expo config
├── src/
│   ├── constants/
│   │   ├── firebase.js       # Firebase init
│   │   └── api.js            # API key + theme colors + goals
│   ├── components/
│   │   ├── CalorieRing.js    # Large donut ring with gradient
│   │   ├── MacroRing.js      # Small SVG macro progress rings
│   │   └── StreakBadge.js    # Flame streak counter
│   └── screens/
│       ├── LoginScreen.js    # Auth - sign in
│       ├── SignupScreen.js   # Auth - create account
│       ├── OnboardingScreen.js # Goal + activity setup
│       ├── HomeScreen.js     # Dashboard with rings + log
│       ├── CameraScreen.js   # Photo → AI analysis → save
│       ├── HistoryScreen.js  # Weekly chart + daily logs
│       ├── ProfileScreen.js  # Profile, goals, settings
│       └── FoodDetailScreen.js # Individual meal view
```

---

## 🔥 Firestore Structure

### `users/{uid}`
```json
{
  "name": "Alex",
  "email": "alex@example.com",
  "calorieGoal": 2000,
  "proteinGoal": 150,
  "carbsGoal": 200,
  "fatGoal": 65,
  "streak": 5,
  "lastLogDate": "Mon Jan 01 2025",
  "goal": "maintain",
  "activity": "moderate"
}
```

### `foods/{id}`
```json
{
  "userId": "uid123",
  "foodName": "Chicken Caesar Salad",
  "servingSize": "1 large plate (350g)",
  "calories": 420,
  "protein": 38,
  "carbs": 22,
  "fat": 18,
  "fiber": 4,
  "sugar": 6,
  "ingredients": ["romaine lettuce", "grilled chicken", "parmesan"],
  "date": "Mon Jan 01 2025",
  "createdAt": "timestamp"
}
```

---

## 🛠 Dependencies

| Package | Purpose |
|---|---|
| `expo-image-picker` | Camera + gallery access |
| `expo-file-system` | Base64 image encoding |
| `expo-linear-gradient` | UI gradients |
| `firebase` | Auth + Firestore database |
| `react-native-svg` | SVG rings/charts |
| `@react-navigation/bottom-tabs` | Tab navigation |
| `@expo/vector-icons` | Ionicons |

---

## 🧠 AI Integration

Claude Vision API is called in `CameraScreen.js`:

```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-opus-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
        { type: 'text', text: '...nutrition JSON prompt...' }
      ]
    }]
  })
});
```

Returns: `{ foodName, calories, protein, carbs, fat, fiber, sugar, servingSize, confidence, ingredients }`

---

## ✅ Firestore Security Rules (recommended)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /foods/{foodId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

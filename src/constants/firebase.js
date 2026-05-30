import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDKA7X5yUK_-QAkxhrdVcaJ3fl7PhZZhSs",
  authDomain: "nutrisnap-f1e6a.firebaseapp.com",
  projectId: "nutrisnap-f1e6a",
  storageBucket: "nutrisnap-f1e6a.firebasestorage.app",
  messagingSenderId: "951581901853",
  appId: "1:951581901853:web:71a9a7e715af4541ad32f4"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
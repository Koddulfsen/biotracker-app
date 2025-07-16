// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyFB4LYrZz66sfxTeeg3FnKkOvRnMWp5o",
  authDomain: "sana-store-da992.firebaseapp.com",
  projectId: "sana-store-da992",
  storageBucket: "sana-store-da992.firebasestorage.app",
  messagingSenderId: "420351016716",
  appId: "1:420351016716:web:b813c2976e349266e69329",
  measurementId: "G-D3PYC6H0JE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 
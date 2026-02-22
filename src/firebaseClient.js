import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA3ktUXk_55eOE8OT5Bck22qDKQn_4O3x4",
    authDomain: "meal-planner-lm10.firebaseapp.com",
    projectId: "meal-planner-lm10",
    storageBucket: "meal-planner-lm10.firebasestorage.app",
    messagingSenderId: "267848663696",
    appId: "1:267848663696:web:57561f996d8b82b2784e15",
    measurementId: "G-PPR185HSRE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

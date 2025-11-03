import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPcoCDghhPbguFmlK7Hdk4DZ3omc4QQEo",
  authDomain: "sourceview-together.firebaseapp.com",
  projectId: "sourceview-together",
  storageBucket: "sourceview-together.firebasestorage.app",
  messagingSenderId: "385390595036",
  appId: "1:385390595036:web:70bcb574cc8d0262905d19",
  measurementId: "G-RRQEY6H0QY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

export { app, storage };


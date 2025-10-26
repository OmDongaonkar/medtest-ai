// src/lib/firebase.ts
/*import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDQ_rqRZoCx_n7VNKqtBlKPXruK1U9OZ_o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medtest-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medtest-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medtest-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "783575790675",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:783575790675:web:0d151c4a3ba2c2230782a6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Configure Google Auth Provider
export const provider = new GoogleAuthProvider();

// Add explicit scopes to ensure we get email
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('openid');

// Custom parameters
provider.setCustomParameters({
  prompt: 'select_account',
  include_granted_scopes: 'true',
});

// Export default app for other uses
export default app;

/*'
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQ_rqRZoCx_n7VNKqtBlKPXruK1U9OZ_o",
  authDomain: "medtest-ai.firebaseapp.com",
  databaseURL: "https://medtest-ai-default-rtdb.firebaseio.com",
  projectId: "medtest-ai",
  storageBucket: "medtest-ai.firebasestorage.app",
  messagingSenderId: "783575790675",
  appId: "1:783575790675:web:0d151c4a3ba2c2230782a6",
  measurementId: "G-BHF2DP37JK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
*/

// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzPHglSb0qNWx1ElDq0oYeNs7v0aZIv5k",
  authDomain: "med-test-269d5.firebaseapp.com",
  databaseURL: "https://med-test-269d5-default-rtdb.firebaseio.com",
  projectId: "med-test-269d5",
  storageBucket: "med-test-269d5.firebasestorage.app",
  messagingSenderId: "42796245867",
  appId: "1:42796245867:web:621840f596c4d49008222e",
  measurementId: "G-59D1HVKRBL"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Configure Google Auth Provider
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('openid');
provider.setCustomParameters({
  prompt: 'select_account',
  include_granted_scopes: 'true',
});

export default app;

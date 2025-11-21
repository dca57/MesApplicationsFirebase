import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🛑 CONFIGURATION MANUELLE OBLIGATOIRE
// ---> En dur pour le mode DEV
// ---> Sur Vercel pour le mode PROD

const isProd = import.meta.env.MODE === "production";

const firebaseConfig = isProd
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : {
      apiKey: "AIzaSyBUFeLriwkzMSW1tq6u9Lx12PwG2aCovSg",
      authDomain: "mesappsfirebase.firebaseapp.com",
      projectId: "mesappsfirebase",
      storageBucket: "mesappsfirebase.appspot.com",
      messagingSenderId: "730508285766",
      appId: "1:730508285766:web:baa0c9fb7976c46845b747",
    };

// Validation de la configuration
const isValidConfig =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("REMPLACEZ_MOI") &&
  firebaseConfig.apiKey !== undefined;

if (!isValidConfig) {
  console.error(
    "❌ ERREUR FATALE : Les clés Firebase ne sont pas configurées dans src/firebase/config.ts"
  );
} else {
  console.log("✅ Firebase Config chargée avec succès");
}

// Initialisation sécurisée
let app;
try {
  if (isValidConfig) {
    app = initializeApp(firebaseConfig);
  } else {
    // Dummy app pour éviter le crash blanc, mais l'auth échouera proprement
    app = initializeApp({ apiKey: "dummy", appId: "dummy" }, "dummy-app");
  }
} catch (e) {
  console.error("Erreur init Firebase:", e);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const APP_PREFIX = "APP00_ADMIN_";

export default app;

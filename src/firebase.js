import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
// Importamos la herramienta de contraseñas
import { getAuth } from "firebase/auth";

// 👇 PON TUS CLAVES REALES AQUÍ 👇
const firebaseConfig = {
  apiKey: "AIzaSyCO7a7XMD-7jXV7cgIJvRRZoNxTlHfjBmk",
  authDomain: "tap-estudio.firebaseapp.com",
  projectId: "tap-estudio",
  storageBucket: "tap-estudio.firebasestorage.app",
  messagingSenderId: "463738987035",
  appId: "1:463738987035:web:134858350e7ad853c64ebe",
};
// 👆 HASTA AQUÍ 👆

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Exportamos el candado para usarlo en la App
export const auth = getAuth(app);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// DEVELOPMENT TEST PHONE ONLY
if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_USE_TEST_PHONE === "true") {
    firebaseAuth.settings.appVerificationDisabledForTesting = true;
}

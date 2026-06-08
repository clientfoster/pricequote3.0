import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const getFirebaseConfig = () => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
    const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

    if (!apiKey || !authDomain || !projectId || !appId) {
        throw new Error(
            'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.'
        );
    }

    return {
        apiKey,
        authDomain,
        projectId,
        appId,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim(),
    };
};

export const getFirebaseAuth = () => {
    const config = getFirebaseConfig();
    const app = getApps().length ? getApp() : initializeApp(config);
    return getAuth(app);
};

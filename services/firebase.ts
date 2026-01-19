// services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyC4JnJSB_-WEHDd78_Ibv0i3-XZdaucHlo",
    authDomain: "alcaravan-health.firebaseapp.com",
    projectId: "alcaravan-health",
    storageBucket: "alcaravan-health.firebasestorage.app",
    messagingSenderId: "272792926087",
    appId: "1:272792926087:web:063ed573b3e84f9cf6c522",
    measurementId: "G-26KKEVGSWJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Función para solicitar permisos de notificación
export const requestNotificationPermission = async () => {
    try {
        if (!messaging) return null;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: 'BNqD_P2kXI3ist3-1sQbuwk6l1s4uCS9lu7Rtp_3mUJImL291d4SeUnYITS5ndFir1SLJEDRZNHtV0AijNth184' // Generar en Firebase Console > Cloud Messaging
            });
            console.log('Token de notificación:', token);
            return token;
        }
    } catch (error) {
        console.error('Error al obtener permiso:', error);
    }
    return null;
};
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyC4JnJSB_-WEHDd78_Ibv0i3-XZdaucHlo",
    authDomain: "alcaravan-health.firebaseapp.com",
    projectId: "alcaravan-health",
    storageBucket: "alcaravan-health.firebasestorage.app",
    messagingSenderId: "272792926087",
    appId: "1:272792926087:web:063ed573b3e84f9cf6c522",
    measurementId: "G-26KKEVGSWJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

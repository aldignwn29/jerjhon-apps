importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBZPveOepAvYOkc6qKj7OFCDFGMERkzsYg",
  authDomain: "centered-smithy-d4dh4.firebaseapp.com",
  projectId: "centered-smithy-d4dh4",
  storageBucket: "centered-smithy-d4dh4.firebasestorage.app",
  messagingSenderId: "37989323623",
  appId: "1:37989323623:web:3efd3c0e90c6ca7c7e95c2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

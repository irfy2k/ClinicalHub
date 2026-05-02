import '../global.css';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Request notification permissions on app launch
    notificationService.requestPermissions();

    // Listen for notifications received while app is in the foreground
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notification Received]', notification.request.content);
      }
    );

    // Listen for user tapping on a notification
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[Notification Tapped]', data);
        // Navigation based on notification type can be handled here
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(doctor)" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

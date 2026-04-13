import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import client from '../api/client';

// Bildirim gösterim ayarları — uygulama açıkken de göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Push token al ve backend'e kaydet
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notification sadece gerçek cihazda çalışır');
    return null;
  }

  // İzin kontrolü
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification izni verilmedi');
    return null;
  }

  // Android için kanal oluştur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('athena-alerts', {
      name: 'Athena Uyarıları',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D4FF',
      sound: true,
    });
  }

  // Expo push token al
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'cbfc6f07-66c0-42d2-82da-7ef55fb6f573',
    });
    const token = tokenData.data;
    console.log('Push token:', token);

    // Backend'e kaydet
    await client.post('/api/monitor/push/register/', { token });
    return token;
  } catch (e) {
    console.log('Push token alınamadı:', e.message);
    return null;
  }
}

// Lokal bildirim gönder (test için)
export async function sendLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // anında gönder
  });
}
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
    return token;
  } catch (e) {
    console.warn('[notifications] push token error:', e);
    return null;
  }
}

export function setupNotificationListeners(
  onReceive?: (n: Notifications.Notification) => void,
  onResponse?: (r: Notifications.NotificationResponse) => void,
) {
  const recvSub = Notifications.addNotificationReceivedListener((n) => {
    onReceive?.(n);
  });
  const respSub = Notifications.addNotificationResponseReceivedListener((r) => {
    onResponse?.(r);
  });
  return () => {
    recvSub.remove();
    respSub.remove();
  };
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds },
  });
}

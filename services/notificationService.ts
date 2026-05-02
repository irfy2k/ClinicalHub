import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Prescription } from '../types/database';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldFlashScreen: false,
  }),
});

export interface ScheduledReminder {
  prescriptionId: string;
  notificationId: string;
  scheduledTime: string;
  medicationName: string;
}

class NotificationService {
  private scheduledReminders: ScheduledReminder[] = [];

  /**
   * Request notification permissions from the user.
   * Returns the Expo push token if on a physical device.
   */
  async requestPermissions(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted.');
      return null;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#85B523',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Appointment Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  }

  /**
   * Schedule local medication reminders for a prescription.
   * Creates daily repeating notifications for each schedule_time in the prescription.
   */
  async scheduleMedicationReminders(prescription: Prescription): Promise<ScheduledReminder[]> {
    const reminders: ScheduledReminder[] = [];

    // Cancel any existing reminders for this prescription first
    await this.cancelRemindersForPrescription(prescription.id);

    for (const time of prescription.schedule_times) {
      const [hours, minutes] = time.split(':').map(Number);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take ${prescription.medication_name} (${prescription.dosage})`,
          data: {
            type: 'medication_reminder',
            prescriptionId: prescription.id,
            medicationName: prescription.medication_name,
            scheduledTime: time,
          },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'medication-reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      const reminder: ScheduledReminder = {
        prescriptionId: prescription.id,
        notificationId,
        scheduledTime: time,
        medicationName: prescription.medication_name,
      };

      reminders.push(reminder);
      this.scheduledReminders.push(reminder);
    }

    return reminders;
  }

  /**
   * Schedule all medication reminders for an array of active prescriptions.
   */
  async scheduleAllMedicationReminders(prescriptions: Prescription[]): Promise<void> {
    const activePrescriptions = prescriptions.filter(p => p.is_active);
    for (const prescription of activePrescriptions) {
      await this.scheduleMedicationReminders(prescription);
    }
  }

  /**
   * Cancel all scheduled reminders for a specific prescription.
   */
  async cancelRemindersForPrescription(prescriptionId: string): Promise<void> {
    const toCancel = this.scheduledReminders.filter(
      r => r.prescriptionId === prescriptionId
    );

    for (const reminder of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    this.scheduledReminders = this.scheduledReminders.filter(
      r => r.prescriptionId !== prescriptionId
    );
  }

  /**
   * Schedule a one-time appointment reminder (30 minutes before).
   */
  async scheduleAppointmentReminder(
    appointmentId: string,
    doctorName: string,
    scheduledAt: string
  ): Promise<string | null> {
    const appointmentTime = new Date(scheduledAt).getTime();
    const reminderTime = appointmentTime - 30 * 60 * 1000; // 30 minutes before
    const now = Date.now();

    if (reminderTime <= now) {
      // Appointment is too soon or in the past
      return null;
    }

    const secondsUntilReminder = Math.floor((reminderTime - now) / 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Upcoming Appointment',
        body: `Your appointment with ${doctorName} starts in 30 minutes.`,
        data: {
          type: 'appointment_reminder',
          appointmentId,
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'appointments' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReminder,
        repeats: false,
      },
    });

    return notificationId;
  }

  /**
   * Send an immediate local notification (used for status updates, confirmations, etc.)
   */
  async sendInstantNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  }

  /**
   * Cancel all scheduled notifications.
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledReminders = [];
  }

  /**
   * Get all currently scheduled notifications (for debugging/display).
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Get the current list of tracked reminders.
   */
  getActiveReminders(): ScheduledReminder[] {
    return [...this.scheduledReminders];
  }

  /**
   * Add listeners for notification events.
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

// Export singleton
export const notificationService = new NotificationService();

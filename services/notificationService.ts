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
  private currentUserId: string | null = null;

  async setCurrentUserId(userId: string | null) {
    if (this.currentUserId && this.currentUserId !== userId) {
      // User changed or logged out, clear everything
      await this.cancelAllNotifications();
    }
    this.currentUserId = userId;
  }

  /**
   * Request notification permissions from the user.
   * Returns the Expo push token if on a physical device.
   */
  async requestPermissions(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
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

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (e) {
      // Silencing warning in Expo Go to avoid terminal noise.
      return null;
    }
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

      if (Platform.OS === 'web') return [];
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
   * Cancels ALL existing medication reminders before scheduling to ensure consistency.
   */
  async scheduleAllMedicationReminders(prescriptions: Prescription[]): Promise<void> {
    if (Platform.OS === 'web') return;

    // 1. Cancel all existing medication reminders
    await this.clearMedicationReminders();

    // 2. Only schedule for active ones
    const activePrescriptions = prescriptions.filter(p => p.is_active);
    for (const prescription of activePrescriptions) {
      await this.scheduleMedicationReminders(prescription);
    }
  }

  /**
   * Clear all scheduled medication reminders.
   */
  async clearMedicationReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'medication_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    this.scheduledReminders = [];
  }

  /**
   * Clear all scheduled appointment reminders.
   */
  async clearAppointmentReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'appointment_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * Cancel all scheduled reminders for a specific prescription.
   */
  async cancelRemindersForPrescription(prescriptionId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (
        notification.content.data?.type === 'medication_reminder' &&
        notification.content.data?.prescriptionId === prescriptionId
      ) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    this.scheduledReminders = this.scheduledReminders.filter(
      r => r.prescriptionId !== prescriptionId
    );
  }

  /**
   * Cancel reminders for a specific appointment.
   */
  async cancelRemindersForAppointment(appointmentId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (
        notification.content.data?.type === 'appointment_reminder' &&
        notification.content.data?.appointmentId === appointmentId
      ) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * Sync appointment reminders for a list of upcoming appointments.
   * Ensures we have reminders for confirmed/pending future appointments and none for others.
   */
  async syncAppointmentReminders(appointments: any[]): Promise<void> {
    if (Platform.OS === 'web') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const now = Date.now();

    // 1. Identify valid appointments for reminders (upcoming & active)
    const validAppointments = appointments.filter(appt => 
      (appt.status === 'pending' || appt.status === 'confirmed') &&
      new Date(appt.scheduled_at).getTime() > now + (31 * 60 * 1000) // At least 31 mins in future
    );

    const validIds = new Set(validAppointments.map(a => a.id));

    // 2. Cancel existing reminders for appointments no longer valid or not in the list
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'appointment_reminder') {
        const apptId = notification.content.data.appointmentId;
        if (!validIds.has(apptId)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    }

    // 3. Schedule reminders for those that don't have one yet
    const currentReminderApptIds = new Set(
      scheduled
        .filter(n => n.content.data?.type === 'appointment_reminder')
        .map(n => n.content.data.appointmentId)
    );

    for (const appt of validAppointments) {
      if (!currentReminderApptIds.has(appt.id)) {
        await this.scheduleAppointmentReminder(
          appt.id,
          appt.doctor_name || 'your doctor',
          appt.scheduled_at
        );
      }
    }
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

    if (Platform.OS === 'web') return null;
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
  async sendInstantNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    targetUserId?: string
  ): Promise<void> {
    if (targetUserId && this.currentUserId && targetUserId !== this.currentUserId) return;
    if (Platform.OS === 'web') return;
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
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
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

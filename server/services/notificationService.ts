import { emailService } from './emailService';
import { smsService } from './smsService';
import { AppointmentSlot } from './appointmentChecker';
import { storage } from '../storage';

export class NotificationService {
  async sendAppointmentNotification(slots: AppointmentSlot[]): Promise<void> {
    const results = [];

    // Send email notification
    try {
      await emailService.sendAppointmentNotification(slots);
      results.push('email');
      console.log('Email notification sent successfully');
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }

    // Send SMS notification if enabled
    try {
      await smsService.sendAppointmentNotification(slots);
      results.push('SMS');
      console.log('SMS notification sent successfully');
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }

    // Log notification activity
    if (results.length > 0) {
      await storage.createActivityLog({
        type: 'notification_sent',
        title: 'Notifications Sent',
        description: `Sent ${results.join(' and ')} notifications for ${slots.length} appointment${slots.length > 1 ? 's' : ''}`,
        action: `Notified via: ${results.join(', ')}`,
        metadata: JSON.stringify({ 
          slots, 
          methods: results,
          timestamp: new Date().toISOString()
        }),
      });
    }
  }

  async sendTestNotifications(): Promise<{ email: boolean; sms: boolean }> {
    const results = { email: false, sms: false };

    // Test email
    try {
      await emailService.sendTestEmail();
      results.email = true;
    } catch (error) {
      console.error('Email test failed:', error);
    }

    // Test SMS
    try {
      await smsService.sendTestSms();
      results.sms = true;
    } catch (error) {
      console.error('SMS test failed:', error);
    }

    return results;
  }
}

export const notificationService = new NotificationService();
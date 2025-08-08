import twilio from 'twilio';
import { storage } from '../storage';
import { AppointmentSlot } from './appointmentChecker';

export class SmsService {
  async sendAppointmentNotification(slots: AppointmentSlot[]): Promise<void> {
    const emailConfig = await storage.getEmailConfig();
    
    if (!emailConfig || !emailConfig.smsEnabled || !emailConfig.twilioAccountSid || !emailConfig.twilioAuthToken || !emailConfig.twilioPhoneNumber || !emailConfig.phoneNumber) {
      console.log('SMS not configured or disabled, skipping SMS notification');
      return;
    }

    const client = twilio(emailConfig.twilioAccountSid, emailConfig.twilioAuthToken);

    const message = this.buildSmsMessage(slots);

    try {
      await client.messages.create({
        body: message,
        from: emailConfig.twilioPhoneNumber,
        to: emailConfig.phoneNumber,
      });

      // Update SMS stats
      const stats = await storage.getMonitoringStats();
      if (stats) {
        await storage.upsertMonitoringStats({
          ...stats,
          smsSent: (stats.smsSent || 0) + 1,
        });
      }

      console.log('SMS notification sent successfully');
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  async sendTestSms(): Promise<void> {
    const emailConfig = await storage.getEmailConfig();
    
    if (!emailConfig || !emailConfig.smsEnabled || !emailConfig.twilioAccountSid || !emailConfig.twilioAuthToken || !emailConfig.twilioPhoneNumber || !emailConfig.phoneNumber) {
      throw new Error('SMS configuration incomplete or disabled');
    }

    const client = twilio(emailConfig.twilioAccountSid, emailConfig.twilioAuthToken);

    await client.messages.create({
      body: 'Test message from your DMV appointment monitor. SMS notifications are working correctly!',
      from: emailConfig.twilioPhoneNumber,
      to: emailConfig.phoneNumber,
    });
  }

  private buildSmsMessage(slots: AppointmentSlot[]): string {
    const slotCount = slots.length;
    const header = `🚗 DMV Alert! ${slotCount} appointment${slotCount > 1 ? 's' : ''} available:`;
    
    const slotDetails = slots.map(slot => {
      const location = slot.location.replace(' DMV', '').replace(' (All Services)', '').replace(' (DL)', ' DL');
      return `• ${location}: ${slot.time}`;
    }).join('\n');

    const footer = 'Book quickly - slots fill up fast!';
    
    return `${header}\n\n${slotDetails}\n\n${footer}`;
  }
}

export const smsService = new SmsService();
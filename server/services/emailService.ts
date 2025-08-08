import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { AppointmentSlot } from './appointmentChecker';

export class EmailService {
  async sendAppointmentNotification(slots: AppointmentSlot[]): Promise<void> {
    const emailConfig = await storage.getEmailConfig();
    
    if (!emailConfig) {
      throw new Error('Email configuration not found');
    }

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpServer,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: emailConfig.smtpUsername && emailConfig.smtpPassword ? {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      } : undefined,
    });

    const subject = `DMV Appointment Available - ${slots.length} slot${slots.length > 1 ? 's' : ''} found!`;
    
    const slotDetails = slots.map(slot => 
      `• ${slot.location}\n  ${slot.time}\n  Book here: ${slot.url}`
    ).join('\n\n');

    const body = `Great news! We found available DMV appointment slots:\n\n${slotDetails}\n\nBook quickly as these slots may fill up fast!`;

    const mailOptions = {
      from: emailConfig.smtpUsername || emailConfig.notificationEmail,
      to: emailConfig.notificationEmail,
      subject,
      text: body,
    };

    await transporter.sendMail(mailOptions);
    
    // Update stats
    const stats = await storage.getMonitoringStats();
    if (stats) {
      await storage.upsertMonitoringStats({
        ...stats,
        emailsSent: (stats.emailsSent || 0) + 1,
      });
    }
  }

  async sendTestEmail(): Promise<void> {
    const emailConfig = await storage.getEmailConfig();
    
    if (!emailConfig) {
      throw new Error('Email configuration not found');
    }

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpServer,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: emailConfig.smtpUsername && emailConfig.smtpPassword ? {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      } : undefined,
    });

    const mailOptions = {
      from: emailConfig.smtpUsername || emailConfig.notificationEmail,
      to: emailConfig.notificationEmail,
      subject: 'DMV Monitor - Test Email',
      text: 'This is a test email from your DMV appointment monitor. If you received this, your email configuration is working correctly!',
    };

    await transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();

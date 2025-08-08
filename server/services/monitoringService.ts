import cron from 'node-cron';
import { storage } from '../storage';
import { appointmentChecker } from './appointmentChecker';
import { emailService } from './emailService';

export class MonitoringService {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private startTime: Date | null = null;

  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const settings = await storage.getMonitoringSettings();
    if (!settings || !settings.isEnabled) {
      throw new Error('Monitoring is not enabled');
    }

    // Stop any existing task
    if (this.task) {
      this.task.stop();
    }

    // Convert interval from seconds to cron expression
    const intervalMinutes = Math.floor(settings.checkInterval / 60);
    const cronExpression = `*/${intervalMinutes} * * * *`;

    this.task = cron.schedule(cronExpression, async () => {
      await this.performCheck();
    }, {
      scheduled: false
    });

    this.task.start();
    this.isRunning = true;
    this.startTime = new Date();

    // Log monitoring started
    await storage.createActivityLog({
      type: 'monitoring_started',
      title: 'Monitoring Started',
      description: `Started monitoring with ${intervalMinutes} minute intervals`,
    });

    console.log(`DMV monitoring started with ${intervalMinutes} minute intervals`);
  }

  async stopMonitoring(): Promise<void> {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    this.isRunning = false;

    // Log monitoring stopped
    await storage.createActivityLog({
      type: 'monitoring_stopped',
      title: 'Monitoring Stopped',
      description: 'Appointment monitoring has been stopped',
    });

    console.log('DMV monitoring stopped');
  }

  async performCheck(): Promise<void> {
    console.log('Performing appointment check...');

    try {
      const slots = await appointmentChecker.checkAppointments();
      
      // Update stats
      const stats = await storage.getMonitoringStats();
      if (stats) {
        await storage.upsertMonitoringStats({
          ...stats,
          totalChecks: stats.totalChecks + 1,
          appointmentsFound: stats.appointmentsFound + slots.length,
          lastCheckTime: new Date(),
          uptime: this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 60000) : stats.uptime,
        });
      }

      if (slots.length > 0) {
        // Send email notification
        await emailService.sendAppointmentNotification(slots);

        // Log appointment found
        await storage.createActivityLog({
          type: 'appointment_found',
          title: 'Appointment Found!',
          description: `Found ${slots.length} available slot${slots.length > 1 ? 's' : ''}: ${slots.map(s => `${s.location} - ${s.time}`).join(', ')}`,
          action: 'Email notification sent',
          metadata: JSON.stringify(slots),
        });

        console.log(`Found ${slots.length} appointments, email sent`);
      } else {
        // Log routine check completed
        const locations = await storage.getDmvLocations();
        const enabledCount = locations.filter(loc => loc.enabled).length;
        
        await storage.createActivityLog({
          type: 'check_completed',
          title: 'Routine Check Completed',
          description: `Checked ${enabledCount} locations - No appointments available`,
        });

        console.log('No appointments found');
      }

    } catch (error) {
      console.error('Error during appointment check:', error);
      
      // Log error
      await storage.createActivityLog({
        type: 'error',
        title: 'Check Failed',
        description: `Appointment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: JSON.stringify({ error: error instanceof Error ? error.stack : error }),
      });
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 60000) : 0,
    };
  }

  async updateSettings(): Promise<void> {
    if (this.isRunning) {
      await this.stopMonitoring();
      await this.startMonitoring();
    }
  }
}

export const monitoringService = new MonitoringService();

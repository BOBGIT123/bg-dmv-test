import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { monitoringService } from "./services/monitoringService";
import { appointmentChecker } from "./services/appointmentChecker";
import { emailService } from "./services/emailService";
import { smsService } from "./services/smsService";
import { notificationService } from "./services/notificationService";
import {
  insertDmvLocationSchema,
  insertEmailConfigSchema,
  insertMonitoringSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // DMV Locations routes
  app.get("/api/dmv-locations", async (_req, res) => {
    try {
      const locations = await storage.getDmvLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DMV locations" });
    }
  });

  app.post("/api/dmv-locations", async (req, res) => {
    try {
      const location = insertDmvLocationSchema.parse(req.body);
      const newLocation = await storage.createDmvLocation(location);
      res.json(newLocation);
    } catch (error) {
      res.status(400).json({ message: "Invalid location data" });
    }
  });

  app.patch("/api/dmv-locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedLocation = await storage.updateDmvLocation(id, updates);
      
      if (!updatedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(updatedLocation);
    } catch (error) {
      res.status(400).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/dmv-locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDmvLocation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Email configuration routes
  app.get("/api/email-config", async (_req, res) => {
    try {
      const config = await storage.getEmailConfig();
      // Don't send sensitive fields in response
      if (config) {
        const { smtpPassword, twilioAuthToken, ...safeConfig } = config;
        res.json(safeConfig);
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email config" });
    }
  });

  app.post("/api/email-config", async (req, res) => {
    try {
      const config = insertEmailConfigSchema.parse(req.body);
      const updatedConfig = await storage.upsertEmailConfig(config);
      
      // Don't send sensitive fields in response
      const { smtpPassword, twilioAuthToken, ...safeConfig } = updatedConfig;
      res.json(safeConfig);
    } catch (error) {
      res.status(400).json({ message: "Invalid email configuration" });
    }
  });

  app.post("/api/email-config/test", async (_req, res) => {
    try {
      await emailService.sendTestEmail();
      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to send test email" 
      });
    }
  });

  app.post("/api/sms-config/test", async (_req, res) => {
    try {
      await smsService.sendTestSms();
      res.json({ success: true, message: "Test SMS sent successfully" });
    } catch (error) {
      console.error("Test SMS error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to send test SMS" 
      });
    }
  });

  app.post("/api/notifications/test", async (_req, res) => {
    try {
      const results = await notificationService.sendTestNotifications();
      const messages = [];
      if (results.email) messages.push("email");
      if (results.sms) messages.push("SMS");
      
      if (messages.length === 0) {
        return res.status(400).json({ message: "No notification methods are configured" });
      }
      
      res.json({ 
        success: true, 
        message: `Test ${messages.join(" and ")} sent successfully`,
        results 
      });
    } catch (error) {
      console.error("Test notifications error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to send test notifications" 
      });
    }
  });

  // Monitoring settings routes
  app.get("/api/monitoring-settings", async (_req, res) => {
    try {
      const settings = await storage.getMonitoringSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monitoring settings" });
    }
  });

  app.post("/api/monitoring-settings", async (req, res) => {
    try {
      const settings = insertMonitoringSettingsSchema.parse(req.body);
      const updatedSettings = await storage.upsertMonitoringSettings(settings);
      
      // Update monitoring service if needed
      await monitoringService.updateSettings();
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Invalid monitoring settings" });
    }
  });

  // Monitoring control routes
  app.post("/api/monitoring/start", async (_req, res) => {
    try {
      await monitoringService.startMonitoring();
      res.json({ success: true, message: "Monitoring started" });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to start monitoring" 
      });
    }
  });

  app.post("/api/monitoring/stop", async (_req, res) => {
    try {
      await monitoringService.stopMonitoring();
      res.json({ success: true, message: "Monitoring stopped" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop monitoring" });
    }
  });

  app.post("/api/monitoring/check-now", async (_req, res) => {
    try {
      await monitoringService.performCheck();
      res.json({ success: true, message: "Check completed" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Check failed" 
      });
    }
  });

  app.get("/api/monitoring/status", async (_req, res) => {
    try {
      const status = monitoringService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get monitoring status" });
    }
  });

  // Activity logs routes
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.delete("/api/activity-logs", async (_req, res) => {
    try {
      await storage.clearActivityLogs();
      res.json({ success: true, message: "Activity logs cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear activity logs" });
    }
  });

  // Monitoring stats routes
  app.get("/api/monitoring-stats", async (_req, res) => {
    try {
      const stats = await storage.getMonitoringStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monitoring stats" });
    }
  });

  const httpServer = createServer(app);

  // Cleanup on server shutdown
  process.on('SIGTERM', async () => {
    await appointmentChecker.close();
    await monitoringService.stopMonitoring();
  });

  process.on('SIGINT', async () => {
    await appointmentChecker.close();
    await monitoringService.stopMonitoring();
  });

  return httpServer;
}

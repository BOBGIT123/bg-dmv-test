import {
  type DmvLocation,
  type InsertDmvLocation,
  type EmailConfig,
  type InsertEmailConfig,
  type MonitoringSettings,
  type InsertMonitoringSettings,
  type ActivityLog,
  type InsertActivityLog,
  type MonitoringStats,
  type InsertMonitoringStats,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // DMV Locations
  getDmvLocations(): Promise<DmvLocation[]>;
  getDmvLocation(id: string): Promise<DmvLocation | undefined>;
  createDmvLocation(location: InsertDmvLocation): Promise<DmvLocation>;
  updateDmvLocation(id: string, location: Partial<DmvLocation>): Promise<DmvLocation | undefined>;
  deleteDmvLocation(id: string): Promise<boolean>;

  // Email Config
  getEmailConfig(): Promise<EmailConfig | undefined>;
  upsertEmailConfig(config: InsertEmailConfig): Promise<EmailConfig>;

  // Monitoring Settings
  getMonitoringSettings(): Promise<MonitoringSettings | undefined>;
  upsertMonitoringSettings(settings: InsertMonitoringSettings): Promise<MonitoringSettings>;

  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  clearActivityLogs(): Promise<void>;

  // Monitoring Stats
  getMonitoringStats(): Promise<MonitoringStats | undefined>;
  upsertMonitoringStats(stats: InsertMonitoringStats): Promise<MonitoringStats>;
}

export class MemStorage implements IStorage {
  private dmvLocations: Map<string, DmvLocation>;
  private emailConfig: EmailConfig | undefined;
  private monitoringSettings: MonitoringSettings | undefined;
  private activityLogs: Map<string, ActivityLog>;
  private monitoringStats: MonitoringStats | undefined;

  constructor() {
    this.dmvLocations = new Map();
    this.activityLogs = new Map();
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize with default DMV locations from the script
    const defaultLocations = [
      {
        name: "Henderson DMV (All Services)",
        url: "https://hendersondmv.waitwell.us/book/1026",
        type: "All Services",
        enabled: true,
      },
      {
        name: "Henderson DMV (DL)",
        url: "https://hendersondmv.waitwell.us/book/994",
        type: "Driver's License Only",
        enabled: true,
      },
      {
        name: "West Flamingo DMV (All Services)",
        url: "https://westflamingodmv.waitwell.us/book/1260",
        type: "All Services",
        enabled: true,
      },
      {
        name: "West Flamingo DMV (DL)",
        url: "https://westflamingodmv.waitwell.us/book/1228",
        type: "Driver's License Only",
        enabled: true,
      },
      {
        name: "North Decatur DMV (All Services)",
        url: "https://northdecaturdmv.waitwell.us/book/1143",
        type: "All Services",
        enabled: false,
      },
      {
        name: "North Decatur DMV (DL)",
        url: "https://northdecaturdmv.waitwell.us/book/1111",
        type: "Driver's License Only",
        enabled: false,
      },
    ];

    defaultLocations.forEach((location) => {
      const id = randomUUID();
      this.dmvLocations.set(id, {
        ...location,
        id,
        createdAt: new Date(),
      });
    });

    // Initialize default monitoring settings
    this.monitoringSettings = {
      id: randomUUID(),
      checkInterval: 300,
      daysAhead: 5,
      businessDaysOnly: true,
      isEnabled: false,
      updatedAt: new Date(),
    };

    // Initialize default stats
    this.monitoringStats = {
      id: randomUUID(),
      totalChecks: 0,
      appointmentsFound: 0,
      emailsSent: 0,
      lastCheckTime: null,
      uptime: 0,
      updatedAt: new Date(),
    };
  }

  // DMV Locations
  async getDmvLocations(): Promise<DmvLocation[]> {
    return Array.from(this.dmvLocations.values()).sort((a, b) => 
      a.createdAt!.getTime() - b.createdAt!.getTime()
    );
  }

  async getDmvLocation(id: string): Promise<DmvLocation | undefined> {
    return this.dmvLocations.get(id);
  }

  async createDmvLocation(location: InsertDmvLocation): Promise<DmvLocation> {
    const id = randomUUID();
    const newLocation: DmvLocation = {
      ...location,
      id,
      createdAt: new Date(),
    };
    this.dmvLocations.set(id, newLocation);
    return newLocation;
  }

  async updateDmvLocation(id: string, updates: Partial<DmvLocation>): Promise<DmvLocation | undefined> {
    const existing = this.dmvLocations.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.dmvLocations.set(id, updated);
    return updated;
  }

  async deleteDmvLocation(id: string): Promise<boolean> {
    return this.dmvLocations.delete(id);
  }

  // Email Config
  async getEmailConfig(): Promise<EmailConfig | undefined> {
    return this.emailConfig;
  }

  async upsertEmailConfig(config: InsertEmailConfig): Promise<EmailConfig> {
    const id = this.emailConfig?.id || randomUUID();
    this.emailConfig = {
      ...config,
      id,
      updatedAt: new Date(),
    };
    return this.emailConfig;
  }

  // Monitoring Settings
  async getMonitoringSettings(): Promise<MonitoringSettings | undefined> {
    return this.monitoringSettings;
  }

  async upsertMonitoringSettings(settings: InsertMonitoringSettings): Promise<MonitoringSettings> {
    const id = this.monitoringSettings?.id || randomUUID();
    this.monitoringSettings = {
      ...settings,
      id,
      updatedAt: new Date(),
    };
    return this.monitoringSettings;
  }

  // Activity Logs
  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const newLog: ActivityLog = {
      ...log,
      id,
      createdAt: new Date(),
    };
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  async clearActivityLogs(): Promise<void> {
    this.activityLogs.clear();
  }

  // Monitoring Stats
  async getMonitoringStats(): Promise<MonitoringStats | undefined> {
    return this.monitoringStats;
  }

  async upsertMonitoringStats(stats: InsertMonitoringStats): Promise<MonitoringStats> {
    const id = this.monitoringStats?.id || randomUUID();
    this.monitoringStats = {
      ...this.monitoringStats,
      ...stats,
      id,
      updatedAt: new Date(),
    };
    return this.monitoringStats;
  }
}

export const storage = new MemStorage();

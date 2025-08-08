import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dmvLocations = pgTable("dmv_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailConfig = pgTable("email_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationEmail: text("notification_email").notNull(),
  smtpServer: text("smtp_server").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpUsername: text("smtp_username"),
  smtpPassword: text("smtp_password"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const monitoringSettings = pgTable("monitoring_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checkInterval: integer("check_interval").default(300), // seconds
  daysAhead: integer("days_ahead").default(5),
  businessDaysOnly: boolean("business_days_only").default(true),
  isEnabled: boolean("is_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'appointment_found', 'check_completed', 'monitoring_started', 'email_sent', etc.
  title: text("title").notNull(),
  description: text("description"),
  action: text("action"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

export const monitoringStats = pgTable("monitoring_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalChecks: integer("total_checks").default(0),
  appointmentsFound: integer("appointments_found").default(0),
  emailsSent: integer("emails_sent").default(0),
  lastCheckTime: timestamp("last_check_time"),
  uptime: integer("uptime").default(0), // minutes
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertDmvLocationSchema = createInsertSchema(dmvLocations).omit({
  id: true,
  createdAt: true,
});

export const insertEmailConfigSchema = createInsertSchema(emailConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertMonitoringSettingsSchema = createInsertSchema(monitoringSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertMonitoringStatsSchema = createInsertSchema(monitoringStats).omit({
  id: true,
  updatedAt: true,
});

// Types
export type DmvLocation = typeof dmvLocations.$inferSelect;
export type InsertDmvLocation = z.infer<typeof insertDmvLocationSchema>;

export type EmailConfig = typeof emailConfig.$inferSelect;
export type InsertEmailConfig = z.infer<typeof insertEmailConfigSchema>;

export type MonitoringSettings = typeof monitoringSettings.$inferSelect;
export type InsertMonitoringSettings = z.infer<typeof insertMonitoringSettingsSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type MonitoringStats = typeof monitoringStats.$inferSelect;
export type InsertMonitoringStats = z.infer<typeof insertMonitoringStatsSchema>;

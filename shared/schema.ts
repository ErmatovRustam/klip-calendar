import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  time,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  addressLine1: varchar("address_line1", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  bookingBufferMinutes: integer("booking_buffer_minutes").default(15),
  maxAdvanceBookingDays: integer("max_advance_booking_days").default(30),
  isActive: boolean("is_active").default(true),
});

export const staffMembers = pgTable("staff_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 200 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  photoUrl: text("photo_url"),
  role: varchar("role", { length: 50 }).default("barber"),
  isActive: boolean("is_active").default(true),
  bio: text("bio"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  priceCents: integer("price_cents").notNull(),
  priceType: varchar("price_type", { length: 20 }).default("fixed"),
  isActive: boolean("is_active").default(true),
  category: varchar("category", { length: 100 }),
  displayOrder: integer("display_order").default(0),
});

export const workingHours = pgTable("working_hours", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: uuid("staff_id").references(() => staffMembers.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").default(true),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staffMembers.id, { onDelete: "set null" }),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  clientPhone: varchar("client_phone", { length: 20 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  status: varchar("status", { length: 50 }).default("confirmed"),
  priceCents: integer("price_cents").notNull(),
  bookingSource: varchar("booking_source", { length: 50 }).default("walk_in"),
  clientNotes: text("client_notes"),
  staffNotes: text("staff_notes"),
  confirmationNumber: varchar("confirmation_number", { length: 20 }).unique(),
});

export const blockedTimes = pgTable("blocked_times", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staffMembers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  source: varchar("source", { length: 50 }).notNull().default("manual"),
  title: varchar("title", { length: 255 }),
  reason: varchar("reason", { length: 50 }),
});

export const calendarSyncs = pgTable("calendar_syncs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staffMembers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerName: varchar("provider_name", { length: 100 }),
  icalUrl: text("ical_url"),
  lastSyncedAt: timestamp("last_synced_at"),
  lastSyncStatus: varchar("last_sync_status", { length: 50 }),
  lastSyncError: text("last_sync_error"),
  eventsCount: integer("events_count").default(0),
  isActive: boolean("is_active").default(true),
});

// Insert schemas
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
export const insertStaffSchema = createInsertSchema(staffMembers).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertWorkingHoursSchema = createInsertSchema(workingHours).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, confirmationNumber: true });
export const insertBlockedTimeSchema = createInsertSchema(blockedTimes).omit({ id: true, createdAt: true });
export const insertCalendarSyncSchema = createInsertSchema(calendarSyncs).omit({ id: true, createdAt: true });

// Types
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertStaffMember = z.infer<typeof insertStaffSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type WorkingHour = typeof workingHours.$inferSelect;
export type InsertWorkingHour = z.infer<typeof insertWorkingHoursSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type BlockedTime = typeof blockedTimes.$inferSelect;
export type InsertBlockedTime = z.infer<typeof insertBlockedTimeSchema>;
export type CalendarSync = typeof calendarSyncs.$inferSelect;
export type InsertCalendarSync = z.infer<typeof insertCalendarSyncSchema>;

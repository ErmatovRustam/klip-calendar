import {
  businesses, staffMembers, services, workingHours, bookings, blockedTimes, calendarSyncs,
  type Business, type InsertBusiness,
  type StaffMember, type InsertStaffMember,
  type Service, type InsertService,
  type WorkingHour, type InsertWorkingHour,
  type Booking, type InsertBooking,
  type BlockedTime, type InsertBlockedTime,
  type CalendarSync, type InsertCalendarSync,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getBusiness(): Promise<Business | undefined>;
  createBusiness(data: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<Business | undefined>;

  getStaff(): Promise<StaffMember[]>;
  getStaffById(id: string): Promise<StaffMember | undefined>;
  createStaff(data: InsertStaffMember): Promise<StaffMember>;
  updateStaff(id: string, data: Partial<InsertStaffMember>): Promise<StaffMember | undefined>;
  deleteStaff(id: string): Promise<void>;

  getServices(): Promise<Service[]>;
  getServiceById(id: string): Promise<Service | undefined>;
  createService(data: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

  getWorkingHours(staffId: string): Promise<WorkingHour[]>;
  setWorkingHours(staffId: string, hours: InsertWorkingHour[]): Promise<WorkingHour[]>;

  getBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  createBooking(data: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined>;

  getBlockedTimes(): Promise<BlockedTime[]>;
  createBlockedTime(data: InsertBlockedTime): Promise<BlockedTime>;
  deleteBlockedTime(id: string): Promise<void>;

  getCalendarSyncs(): Promise<CalendarSync[]>;
  createCalendarSync(data: InsertCalendarSync): Promise<CalendarSync>;
  deleteCalendarSync(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getBusiness(): Promise<Business | undefined> {
    const result = await db.select().from(businesses).limit(1);
    return result[0];
  }

  async createBusiness(data: InsertBusiness): Promise<Business> {
    const [result] = await db.insert(businesses).values(data).returning();
    return result;
  }

  async updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [result] = await db.update(businesses).set(data).where(eq(businesses.id, id)).returning();
    return result;
  }

  async getStaff(): Promise<StaffMember[]> {
    return db.select().from(staffMembers);
  }

  async getStaffById(id: string): Promise<StaffMember | undefined> {
    const [result] = await db.select().from(staffMembers).where(eq(staffMembers.id, id));
    return result;
  }

  async createStaff(data: InsertStaffMember): Promise<StaffMember> {
    const [result] = await db.insert(staffMembers).values(data).returning();
    return result;
  }

  async updateStaff(id: string, data: Partial<InsertStaffMember>): Promise<StaffMember | undefined> {
    const [result] = await db.update(staffMembers).set(data).where(eq(staffMembers.id, id)).returning();
    return result;
  }

  async deleteStaff(id: string): Promise<void> {
    await db.delete(staffMembers).where(eq(staffMembers.id, id));
  }

  async getServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const [result] = await db.select().from(services).where(eq(services.id, id));
    return result;
  }

  async createService(data: InsertService): Promise<Service> {
    const [result] = await db.insert(services).values(data).returning();
    return result;
  }

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const [result] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return result;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getWorkingHours(staffId: string): Promise<WorkingHour[]> {
    return db.select().from(workingHours).where(eq(workingHours.staffId, staffId));
  }

  async setWorkingHours(staffId: string, hours: InsertWorkingHour[]): Promise<WorkingHour[]> {
    await db.delete(workingHours).where(eq(workingHours.staffId, staffId));
    if (hours.length === 0) return [];
    const toInsert = hours.map((h) => ({ ...h, staffId }));
    return db.insert(workingHours).values(toInsert).returning();
  }

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [result] = await db.select().from(bookings).where(eq(bookings.id, id));
    return result;
  }

  async createBooking(data: InsertBooking): Promise<Booking> {
    const confNum = "BK-" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const [result] = await db.insert(bookings).values({ ...data, confirmationNumber: confNum }).returning();
    return result;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [result] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return result;
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    return db.select().from(blockedTimes);
  }

  async createBlockedTime(data: InsertBlockedTime): Promise<BlockedTime> {
    const [result] = await db.insert(blockedTimes).values(data).returning();
    return result;
  }

  async deleteBlockedTime(id: string): Promise<void> {
    await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
  }

  async getCalendarSyncs(): Promise<CalendarSync[]> {
    return db.select().from(calendarSyncs);
  }

  async createCalendarSync(data: InsertCalendarSync): Promise<CalendarSync> {
    const [result] = await db.insert(calendarSyncs).values(data).returning();
    return result;
  }

  async deleteCalendarSync(id: string): Promise<void> {
    await db.delete(calendarSyncs).where(eq(calendarSyncs.id, id));
  }
}

export const storage = new DatabaseStorage();

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertStaffSchema, insertServiceSchema, insertBookingSchema,
  insertBlockedTimeSchema, insertCalendarSyncSchema, insertBusinessSchema,
} from "@shared/schema";
import { z } from "zod";

async function getBusinessOrFail(res: any): Promise<{ id: string } | null> {
  const business = await storage.getBusiness();
  if (!business) {
    res.status(400).json({ message: "No business configured. Please set up your business first." });
    return null;
  }
  return business;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Business
  app.get("/api/business", async (_req, res) => {
    try {
      const business = await storage.getBusiness();
      if (!business) return res.status(404).json({ message: "No business found" });
      res.json(business);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/business", async (req, res) => {
    try {
      const business = await storage.getBusiness();
      if (!business) return res.status(404).json({ message: "No business found" });
      const partial = insertBusinessSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: partial.error.message });
      const updated = await storage.updateBusiness(business.id, partial.data);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Staff
  app.get("/api/staff", async (_req, res) => {
    try {
      res.json(await storage.getStaff());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.getStaffById(req.params.id);
      if (!staff) return res.status(404).json({ message: "Not found" });
      res.json(staff);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const business = await getBusinessOrFail(res);
      if (!business) return;
      const parsed = insertStaffSchema.omit({ businessId: true }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const staff = await storage.createStaff({ ...parsed.data, businessId: business.id });
      res.status(201).json(staff);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const partial = insertStaffSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: partial.error.message });
      const updated = await storage.updateStaff(req.params.id, partial.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      await storage.deleteStaff(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Services
  app.get("/api/services", async (_req, res) => {
    try {
      res.json(await storage.getServices());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const business = await getBusinessOrFail(res);
      if (!business) return;
      const parsed = insertServiceSchema.omit({ businessId: true }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const service = await storage.createService({ ...parsed.data, businessId: business.id });
      res.status(201).json(service);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    try {
      const partial = insertServiceSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: partial.error.message });
      const updated = await storage.updateService(req.params.id, partial.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Working Hours
  app.get("/api/working-hours/:staffId", async (req, res) => {
    try {
      res.json(await storage.getWorkingHours(req.params.staffId));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/working-hours/:staffId", async (req, res) => {
    try {
      const { hours } = req.body;
      if (!Array.isArray(hours)) return res.status(400).json({ message: "hours must be an array" });
      const result = await storage.setWorkingHours(req.params.staffId, hours);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Bookings
  app.get("/api/bookings", async (_req, res) => {
    try {
      res.json(await storage.getBookings());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const business = await getBusinessOrFail(res);
      if (!business) return;
      const data = { ...req.body, businessId: business.id };
      if (data.startTime) data.startTime = new Date(data.startTime);
      if (data.endTime) data.endTime = new Date(data.endTime);
      const parsed = insertBookingSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const booking = await storage.createBooking(parsed.data);
      res.status(201).json(booking);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.startTime) data.startTime = new Date(data.startTime);
      if (data.endTime) data.endTime = new Date(data.endTime);
      const updated = await storage.updateBooking(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Blocked Times
  app.get("/api/blocked-times", async (_req, res) => {
    try {
      res.json(await storage.getBlockedTimes());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/blocked-times", async (req, res) => {
    try {
      const business = await getBusinessOrFail(res);
      if (!business) return;
      const data = { ...req.body, businessId: business.id };
      if (data.startTime) data.startTime = new Date(data.startTime);
      if (data.endTime) data.endTime = new Date(data.endTime);
      const parsed = insertBlockedTimeSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const blocked = await storage.createBlockedTime(parsed.data);
      res.status(201).json(blocked);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/blocked-times/:id", async (req, res) => {
    try {
      await storage.deleteBlockedTime(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Calendar Syncs
  app.get("/api/calendar-syncs", async (_req, res) => {
    try {
      res.json(await storage.getCalendarSyncs());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/calendar-syncs", async (req, res) => {
    try {
      const business = await getBusinessOrFail(res);
      if (!business) return;
      const data = { ...req.body, businessId: business.id };
      const parsed = insertCalendarSyncSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const sync = await storage.createCalendarSync(parsed.data);
      res.status(201).json(sync);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/calendar-syncs/:id", async (req, res) => {
    try {
      await storage.deleteCalendarSync(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}

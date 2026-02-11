import { storage } from "./storage";
import { addDays, setHours, setMinutes, startOfToday } from "date-fns";

export async function seedDatabase() {
  const existingBusiness = await storage.getBusiness();
  if (existingBusiness) return;

  const business = await storage.createBusiness({
    name: "Sharp Cuts Barbershop",
    slug: "sharp-cuts",
    email: "info@sharpcuts.com",
    phone: "(555) 123-4567",
    timezone: "America/New_York",
    addressLine1: "123 Main Street",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11201",
    bookingBufferMinutes: 15,
    maxAdvanceBookingDays: 30,
    isActive: true,
  });

  const barbers = await Promise.all([
    storage.createStaff({
      businessId: business.id,
      firstName: "Marcus",
      lastName: "Johnson",
      displayName: "Marcus J.",
      email: "marcus@sharpcuts.com",
      phone: "(555) 111-0001",
      role: "master_barber",
      isActive: true,
      bio: "15 years of experience. Specializes in fades and precision cuts.",
      color: "#3B82F6",
    }),
    storage.createStaff({
      businessId: business.id,
      firstName: "Devon",
      lastName: "Williams",
      displayName: "Devon W.",
      email: "devon@sharpcuts.com",
      phone: "(555) 111-0002",
      role: "barber",
      isActive: true,
      bio: "Expert in modern styles and beard grooming.",
      color: "#10B981",
    }),
    storage.createStaff({
      businessId: business.id,
      firstName: "Alex",
      lastName: "Rivera",
      displayName: "Alex R.",
      email: "alex@sharpcuts.com",
      phone: "(555) 111-0003",
      role: "barber",
      isActive: true,
      bio: "Creative stylist with a passion for classic cuts.",
      color: "#F59E0B",
    }),
  ]);

  const servicesList = await Promise.all([
    storage.createService({ businessId: business.id, name: "Classic Haircut", durationMinutes: 30, priceCents: 3500, category: "haircut", displayOrder: 1, isActive: true }),
    storage.createService({ businessId: business.id, name: "Fade", durationMinutes: 30, priceCents: 4000, category: "haircut", displayOrder: 2, isActive: true }),
    storage.createService({ businessId: business.id, name: "Buzz Cut", durationMinutes: 20, priceCents: 2500, category: "haircut", displayOrder: 3, isActive: true }),
    storage.createService({ businessId: business.id, name: "Kids Haircut", durationMinutes: 25, priceCents: 2500, category: "haircut", displayOrder: 4, isActive: true }),
    storage.createService({ businessId: business.id, name: "Beard Trim", durationMinutes: 15, priceCents: 1500, category: "shave", displayOrder: 5, isActive: true }),
    storage.createService({ businessId: business.id, name: "Hot Towel Shave", durationMinutes: 30, priceCents: 3000, category: "shave", displayOrder: 6, isActive: true }),
    storage.createService({ businessId: business.id, name: "Haircut & Beard Combo", durationMinutes: 45, priceCents: 5000, category: "combo", displayOrder: 7, isActive: true }),
    storage.createService({ businessId: business.id, name: "Hair Color", durationMinutes: 60, priceCents: 6000, category: "color", displayOrder: 8, isActive: true }),
  ]);

  for (const barber of barbers) {
    await storage.setWorkingHours(barber.id, [
      { staffId: barber.id, dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
      { staffId: barber.id, dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },
      { staffId: barber.id, dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true },
      { staffId: barber.id, dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },
      { staffId: barber.id, dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isActive: true },
      { staffId: barber.id, dayOfWeek: 6, startTime: "10:00", endTime: "15:00", isActive: true },
    ]);
  }

  const today = startOfToday();
  const bookingData = [
    { clientName: "James Thompson", clientPhone: "(555) 200-0001", staffIdx: 0, serviceIdx: 0, dayOffset: 0, hour: 9, min: 0, source: "consumer_app" },
    { clientName: "Michael Chen", clientPhone: "(555) 200-0002", staffIdx: 1, serviceIdx: 1, dayOffset: 0, hour: 10, min: 0, source: "walk_in" },
    { clientName: "David Garcia", clientPhone: "(555) 200-0003", staffIdx: 2, serviceIdx: 6, dayOffset: 0, hour: 11, min: 0, source: "voice_agent" },
    { clientName: "Robert Wilson", clientPhone: "(555) 200-0004", staffIdx: 0, serviceIdx: 4, dayOffset: 0, hour: 14, min: 0, source: "phone" },
    { clientName: "Chris Baker", clientPhone: "(555) 200-0005", staffIdx: 1, serviceIdx: 0, dayOffset: 1, hour: 9, min: 30, source: "consumer_app" },
    { clientName: "Tyler Scott", clientPhone: "(555) 200-0006", staffIdx: 0, serviceIdx: 1, dayOffset: 1, hour: 11, min: 0, source: "walk_in" },
    { clientName: "Nathan Kim", clientPhone: "(555) 200-0007", staffIdx: 2, serviceIdx: 5, dayOffset: 1, hour: 13, min: 0, source: "consumer_app" },
    { clientName: "Aaron Davis", clientPhone: "(555) 200-0008", staffIdx: 0, serviceIdx: 7, dayOffset: 2, hour: 10, min: 0, source: "phone" },
    { clientName: "Jordan Lee", clientPhone: "(555) 200-0009", staffIdx: 1, serviceIdx: 2, dayOffset: 2, hour: 14, min: 0, source: "consumer_app" },
    { clientName: "Brandon Moore", clientPhone: "(555) 200-0010", staffIdx: 2, serviceIdx: 0, dayOffset: 3, hour: 9, min: 0, source: "voice_agent" },
  ];

  for (const bd of bookingData) {
    const service = servicesList[bd.serviceIdx];
    const barber = barbers[bd.staffIdx];
    const startTime = setMinutes(setHours(addDays(today, bd.dayOffset), bd.hour), bd.min);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    await storage.createBooking({
      businessId: business.id,
      staffId: barber.id,
      serviceId: service.id,
      startTime,
      endTime,
      durationMinutes: service.durationMinutes,
      clientName: bd.clientName,
      clientPhone: bd.clientPhone,
      priceCents: service.priceCents,
      bookingSource: bd.source,
      status: "confirmed",
    });
  }

  await storage.createBlockedTime({
    businessId: business.id,
    staffId: barbers[0].id,
    startTime: setMinutes(setHours(addDays(today, 1), 15), 0),
    endTime: setMinutes(setHours(addDays(today, 1), 16), 30),
    source: "google",
    title: "Personal Appointment",
  });

  await storage.createBlockedTime({
    businessId: business.id,
    staffId: barbers[1].id,
    startTime: setMinutes(setHours(addDays(today, 2), 12), 0),
    endTime: setMinutes(setHours(addDays(today, 2), 13), 0),
    source: "manual",
    title: "Lunch Break",
  });

  console.log("Database seeded successfully");
}

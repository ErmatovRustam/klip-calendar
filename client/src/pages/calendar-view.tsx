import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  differenceInMinutes,
  startOfDay,
} from "date-fns";
import type { Booking, StaffMember, BlockedTime } from "@shared/schema";

type ViewMode = "day" | "week";

const HOUR_HEIGHT = 64;
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");

  const { data: bookings, isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: staff, isLoading: loadingStaff } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: blockedTimes, isLoading: loadingBlocked } = useQuery<BlockedTime[]>({
    queryKey: ["/api/blocked-times"],
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = viewMode === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [currentDate];

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => {
      if (b.status === "cancelled") return false;
      if (selectedStaffId !== "all" && b.staffId !== selectedStaffId) return false;
      const bDate = new Date(b.startTime);
      return weekDays.some((d) => isSameDay(bDate, d));
    });
  }, [bookings, selectedStaffId, weekDays]);

  const filteredBlocked = useMemo(() => {
    if (!blockedTimes) return [];
    return blockedTimes.filter((bt) => {
      if (selectedStaffId !== "all" && bt.staffId !== selectedStaffId) return false;
      const btDate = new Date(bt.startTime);
      return weekDays.some((d) => isSameDay(btDate, d));
    });
  }, [blockedTimes, selectedStaffId, weekDays]);

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? addDays(currentDate, -1) : addDays(currentDate, 1));
    }
  };

  const getStaffColor = (staffId: string | null) => {
    if (!staffId || !staff) return "#6B7280";
    const member = staff.find((s) => s.id === staffId);
    return member?.color || "#3B82F6";
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId || !staff) return "Unassigned";
    const member = staff.find((s) => s.id === staffId);
    return member?.displayName || `${member?.firstName} ${member?.lastName}` || "Unknown";
  };

  const getEventPosition = (startTime: Date) => {
    const dayStart = setMinutes(setHours(startOfDay(startTime), START_HOUR), 0);
    const minutesFromStart = differenceInMinutes(startTime, dayStart);
    return (minutesFromStart / 60) * HOUR_HEIGHT;
  };

  const getEventHeight = (durationMinutes: number) => {
    return (durationMinutes / 60) * HOUR_HEIGHT;
  };

  const isLoading = loadingBookings || loadingStaff || loadingBlocked;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigateDate("prev")} data-testid="button-cal-prev">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => navigateDate("next")} data-testid="button-cal-next">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold" data-testid="text-calendar-date">
            {viewMode === "week"
              ? `${format(weekStart, "MMM d")} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`
              : format(currentDate, "EEEE, MMMM d, yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            data-testid="button-cal-today"
          >
            Today
          </Button>
          <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
            <SelectTrigger className="w-24" data-testid="select-view-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="w-40" data-testid="select-staff-filter">
              <SelectValue placeholder="All Barbers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Barbers</SelectItem>
              {staff?.filter((s) => s.isActive).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.displayName || `${s.firstName} ${s.lastName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="min-w-[600px]">
            <div className="grid" style={{ gridTemplateColumns: `60px repeat(${weekDays.length}, 1fr)` }}>
              <div className="border-b border-r p-2 sticky top-0 z-10 bg-background" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`border-b border-r p-2 text-center sticky top-0 z-10 bg-background ${
                    isToday(day) ? "bg-primary/5" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                  <p
                    className={`text-lg font-semibold ${
                      isToday(day) ? "text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid relative" style={{ gridTemplateColumns: `60px repeat(${weekDays.length}, 1fr)` }}>
              <div className="border-r">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="absolute -top-3 right-2 text-xs text-muted-foreground">
                      {format(setHours(new Date(), hour), "h a")}
                    </span>
                  </div>
                ))}
              </div>

              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`border-r relative ${isToday(day) ? "bg-primary/5" : ""}`}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-dashed"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {filteredBlocked
                    .filter((bt) => isSameDay(new Date(bt.startTime), day))
                    .map((bt) => {
                      const start = new Date(bt.startTime);
                      const end = new Date(bt.endTime);
                      const durationMins = differenceInMinutes(end, start);
                      const top = getEventPosition(start);
                      const height = getEventHeight(durationMins);

                      return (
                        <div
                          key={bt.id}
                          className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden z-[1] opacity-60"
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 20)}px`,
                            background: "repeating-linear-gradient(45deg, hsl(var(--muted)), hsl(var(--muted)) 4px, hsl(var(--muted-foreground) / 0.1) 4px, hsl(var(--muted-foreground) / 0.1) 8px)",
                          }}
                          data-testid={`blocked-${bt.id}`}
                        >
                          <p className="text-xs font-medium truncate text-muted-foreground">
                            {bt.title || "Blocked"}
                          </p>
                        </div>
                      );
                    })}

                  {filteredBookings
                    .filter((b) => isSameDay(new Date(b.startTime), day))
                    .map((booking) => {
                      const start = new Date(booking.startTime);
                      const top = getEventPosition(start);
                      const height = getEventHeight(booking.durationMinutes);
                      const color = getStaffColor(booking.staffId);

                      return (
                        <div
                          key={booking.id}
                          className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden z-[2] text-white cursor-pointer"
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 24)}px`,
                            backgroundColor: color,
                          }}
                          data-testid={`booking-event-${booking.id}`}
                        >
                          <p className="text-xs font-semibold truncate">{booking.clientName}</p>
                          {height > 30 && (
                            <p className="text-xs truncate opacity-90">
                              {format(start, "h:mm a")} - {getStaffName(booking.staffId)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

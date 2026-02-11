import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Scissors, Clock, TrendingUp, DollarSign } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import type { Booking, StaffMember, Service } from "@shared/schema";

export default function Dashboard() {
  const { data: bookings, isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: staff, isLoading: loadingStaff } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: services, isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const todayBookings = bookings?.filter(
    (b) => isToday(new Date(b.startTime)) && b.status === "confirmed"
  ) || [];

  const totalRevenue = todayBookings.reduce((sum, b) => sum + b.priceCents, 0);

  const upcomingBookings = bookings
    ?.filter((b) => new Date(b.startTime) >= new Date() && b.status === "confirmed")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5) || [];

  const isLoading = loadingBookings || loadingStaff || loadingServices;

  const stats = [
    {
      title: "Today's Appointments",
      value: todayBookings.length,
      icon: Calendar,
      description: "Confirmed for today",
    },
    {
      title: "Active Barbers",
      value: staff?.filter((s) => s.isActive).length || 0,
      icon: Users,
      description: "Currently active",
    },
    {
      title: "Services Offered",
      value: services?.filter((s) => s.isActive).length || 0,
      icon: Scissors,
      description: "Active services",
    },
    {
      title: "Today's Revenue",
      value: `$${(totalRevenue / 100).toFixed(2)}`,
      icon: DollarSign,
      description: "From confirmed bookings",
    },
  ];

  const getStaffName = (staffId: string | null) => {
    if (!staffId || !staff) return "Unassigned";
    const member = staff.find((s) => s.id === staffId);
    return member?.displayName || `${member?.firstName} ${member?.lastName}` || "Unknown";
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId || !services) return "Unknown";
    const service = services.find((s) => s.id === serviceId);
    return service?.name || "Unknown";
  };

  const getStaffColor = (staffId: string | null) => {
    if (!staffId || !staff) return "#6B7280";
    const member = staff.find((s) => s.id === staffId);
    return member?.color || "#3B82F6";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome to Klip-Calendar. Here's your barbershop overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {stat.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                    data-testid={`card-booking-${booking.id}`}
                  >
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStaffColor(booking.staffId) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getServiceName(booking.serviceId)} with {getStaffName(booking.staffId)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium">
                        {format(new Date(booking.startTime), "h:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isToday(new Date(booking.startTime))
                          ? "Today"
                          : format(new Date(booking.startTime), "MMM d")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span className="text-sm text-muted-foreground">Total Bookings</span>
                  <span className="text-sm font-medium">{bookings?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <Badge variant="secondary">
                    {bookings?.filter((b) => b.status === "confirmed").length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                  <Badge variant="secondary">
                    {bookings?.filter((b) => b.status === "cancelled").length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span className="text-sm text-muted-foreground">Booking Sources</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {Array.from(new Set(bookings?.map((b) => b.bookingSource) || [])).map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

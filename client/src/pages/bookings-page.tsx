import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Booking, StaffMember, Service, InsertBooking } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export default function BookingsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [form, setForm] = useState({
    staffId: "",
    serviceId: "",
    startTime: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientNotes: "",
    bookingSource: "walk_in",
  });

  const { data: bookings, isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: staff } = useQuery<StaffMember[]>({ queryKey: ["/api/staff"] });
  const { data: services } = useQuery<Service[]>({ queryKey: ["/api/services"] });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const service = services?.find((s) => s.id === data.serviceId);
      if (!service) throw new Error("Service required");
      const startDate = new Date(data.startTime);
      const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);
      const body: Partial<InsertBooking> = {
        staffId: data.staffId || null,
        serviceId: data.serviceId,
        startTime: startDate,
        endTime: endDate,
        durationMinutes: service.durationMinutes,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || null,
        priceCents: service.priceCents,
        bookingSource: data.bookingSource,
        clientNotes: data.clientNotes || null,
        status: "confirmed",
      };
      return apiRequest("POST", "/api/bookings", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking created" });
      setOpen(false);
      setForm({ staffId: "", serviceId: "", startTime: "", clientName: "", clientPhone: "", clientEmail: "", clientNotes: "", bookingSource: "walk_in" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/bookings/${id}`, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking cancelled" });
    },
  });

  const filteredBookings = bookings
    ?.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.clientName.toLowerCase().includes(q) ||
          b.clientPhone.includes(q) ||
          (b.confirmationNumber && b.confirmationNumber.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

  const getStaffName = (id: string | null) => {
    if (!id || !staff) return "Any";
    const s = staff.find((m) => m.id === id);
    return s?.displayName || `${s?.firstName} ${s?.lastName}` || "Unknown";
  };

  const getServiceName = (id: string | null) => {
    if (!id || !services) return "Unknown";
    return services.find((s) => s.id === id)?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-bookings-title">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all appointments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-booking">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Client Name</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  data-testid="input-client-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.clientPhone}
                    onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                    data-testid="input-client-phone"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    data-testid="input-client-email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Service</Label>
                <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                  <SelectTrigger data-testid="select-booking-service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.filter((s) => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - ${(s.priceCents / 100).toFixed(2)} ({s.durationMinutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Barber</Label>
                <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                  <SelectTrigger data-testid="select-booking-staff">
                    <SelectValue placeholder="Select barber" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.filter((s) => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.displayName || `${s.firstName} ${s.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  data-testid="input-booking-datetime"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.bookingSource} onValueChange={(v) => setForm({ ...form, bookingSource: v })}>
                  <SelectTrigger data-testid="select-booking-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="consumer_app">Consumer App</SelectItem>
                    <SelectItem value="voice_agent">Voice Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.clientNotes}
                  onChange={(e) => setForm({ ...form, clientNotes: e.target.value })}
                  placeholder="Optional notes..."
                  data-testid="input-booking-notes"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.clientName || !form.clientPhone || !form.serviceId || !form.startTime}
                data-testid="button-create-booking"
              >
                {createMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, or confirmation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-bookings"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadingBookings ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !filteredBookings.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} data-testid={`card-booking-list-${booking.id}`}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{booking.clientName}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[booking.status || "confirmed"]}`}>
                      {booking.status}
                    </span>
                    {booking.confirmationNumber && (
                      <Badge variant="outline" className="text-xs">{booking.confirmationNumber}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {getServiceName(booking.serviceId)} with {getStaffName(booking.staffId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.clientPhone}
                    {booking.bookingSource && ` · via ${booking.bookingSource.replace("_", " ")}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">
                    {format(new Date(booking.startTime), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                  </p>
                  <p className="text-sm font-medium">${(booking.priceCents / 100).toFixed(2)}</p>
                </div>
                <div>
                  {booking.status === "confirmed" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => cancelMutation.mutate(booking.id)}
                      data-testid={`button-cancel-booking-${booking.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

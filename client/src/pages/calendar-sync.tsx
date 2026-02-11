import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, RefreshCcw, Link as LinkIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CalendarSync, StaffMember } from "@shared/schema";

const PROVIDERS = [
  { value: "google", label: "Google Calendar" },
  { value: "ical", label: "iCal" },
  { value: "vagaro", label: "Vagaro" },
  { value: "booksy", label: "Booksy" },
  { value: "other", label: "Other" },
];

export default function CalendarSyncPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    staffId: "",
    provider: "google",
    providerName: "",
    icalUrl: "",
  });

  const { data: syncs, isLoading: loadingSyncs } = useQuery<CalendarSync[]>({
    queryKey: ["/api/calendar-syncs"],
  });

  const { data: staff } = useQuery<StaffMember[]>({ queryKey: ["/api/staff"] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/calendar-syncs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-syncs"] });
      toast({ title: "Calendar sync added" });
      setOpen(false);
      setForm({ staffId: "", provider: "google", providerName: "", icalUrl: "" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/calendar-syncs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-syncs"] });
      toast({ title: "Sync removed" });
    },
  });

  const getStaffName = (id: string | null) => {
    if (!id || !staff) return "Unknown";
    const s = staff.find((m) => m.id === id);
    return s?.displayName || `${s?.firstName} ${s?.lastName}` || "Unknown";
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-sync-title">Calendar Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect external calendars to automatically block times
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-sync">
              <Plus className="w-4 h-4 mr-2" />
              Add Calendar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Calendar Sync</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Barber</Label>
                <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                  <SelectTrigger data-testid="select-sync-staff">
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
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger data-testid="select-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Calendar Name</Label>
                <Input
                  value={form.providerName}
                  onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                  placeholder="e.g. Personal Google Calendar"
                  data-testid="input-provider-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>iCal URL</Label>
                <Input
                  value={form.icalUrl}
                  onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
                  placeholder="https://calendar.google.com/..."
                  data-testid="input-ical-url"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.staffId || !form.icalUrl}
                data-testid="button-save-sync"
              >
                {createMutation.isPending ? "Adding..." : "Add Calendar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingSyncs ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !syncs?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No calendars synced</p>
            <p className="text-sm text-muted-foreground">
              Connect an external calendar to sync blocked times
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {syncs.map((sync) => (
            <Card key={sync.id} data-testid={`card-sync-${sync.id}`}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted flex-shrink-0">
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">
                      {sync.providerName || PROVIDERS.find((p) => p.value === sync.provider)?.label}
                    </h3>
                    <Badge variant={sync.isActive ? "secondary" : "outline"}>
                      {sync.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStaffName(sync.staffId)}
                    {sync.eventsCount ? ` · ${sync.eventsCount} events` : ""}
                  </p>
                  {sync.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {format(new Date(sync.lastSyncedAt), "MMM d, h:mm a")}
                      {sync.lastSyncStatus && ` · ${sync.lastSyncStatus}`}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(sync.id)}
                  data-testid={`button-delete-sync-${sync.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

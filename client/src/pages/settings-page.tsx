import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Business } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    zipCode: "",
    timezone: "America/New_York",
    bookingBufferMinutes: 15,
    maxAdvanceBookingDays: 30,
  });

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        email: business.email || "",
        phone: business.phone || "",
        addressLine1: business.addressLine1 || "",
        city: business.city || "",
        state: business.state || "",
        zipCode: business.zipCode || "",
        timezone: business.timezone || "America/New_York",
        bookingBufferMinutes: business.bookingBufferMinutes || 15,
        maxAdvanceBookingDays: business.maxAdvanceBookingDays || 30,
      });
    }
  }, [business]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("PATCH", "/api/business", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your business information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-business-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                data-testid="input-business-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                data-testid="input-business-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                data-testid="input-timezone"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              placeholder="Street address"
              data-testid="input-address"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                data-testid="input-city"
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                data-testid="input-state"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ZIP</Label>
              <Input
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                data-testid="input-zip"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Booking Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Buffer Between Bookings (minutes)</Label>
              <Input
                type="number"
                value={form.bookingBufferMinutes}
                onChange={(e) => setForm({ ...form, bookingBufferMinutes: parseInt(e.target.value) || 0 })}
                data-testid="input-buffer-minutes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Advance Booking (days)</Label>
              <Input
                type="number"
                value={form.maxAdvanceBookingDays}
                onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: parseInt(e.target.value) || 0 })}
                data-testid="input-max-advance"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        onClick={() => updateMutation.mutate(form)}
        disabled={updateMutation.isPending}
        data-testid="button-save-settings"
      >
        {updateMutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

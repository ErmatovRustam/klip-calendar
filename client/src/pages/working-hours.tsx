import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StaffMember, WorkingHour } from "@shared/schema";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface HourRow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const defaultHours: HourRow[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
  isActive: i >= 1 && i <= 5,
}));

export default function WorkingHoursPage() {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [hours, setHours] = useState<HourRow[]>(defaultHours);
  const { toast } = useToast();

  const { data: staff, isLoading: loadingStaff } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: workingHours, isLoading: loadingHours } = useQuery<WorkingHour[]>({
    queryKey: ["/api/working-hours", selectedStaffId],
    enabled: !!selectedStaffId,
  });

  useEffect(() => {
    if (staff?.length && !selectedStaffId) {
      setSelectedStaffId(staff[0].id);
    }
  }, [staff, selectedStaffId]);

  useEffect(() => {
    if (workingHours) {
      const merged = defaultHours.map((dh) => {
        const existing = workingHours.find((wh) => wh.dayOfWeek === dh.dayOfWeek);
        if (existing) {
          return {
            dayOfWeek: existing.dayOfWeek,
            startTime: existing.startTime,
            endTime: existing.endTime,
            isActive: existing.isActive ?? true,
          };
        }
        return dh;
      });
      setHours(merged);
    }
  }, [workingHours]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/working-hours/${selectedStaffId}`, { hours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/working-hours", selectedStaffId] });
      toast({ title: "Working hours saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateHour = (dayOfWeek: number, field: keyof HourRow, value: string | boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-hours-title">Working Hours</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure each barber's schedule</p>
      </div>

      <div className="space-y-1.5">
        <Label>Select Barber</Label>
        {loadingStaff ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger data-testid="select-hours-staff">
              <SelectValue placeholder="Select a barber" />
            </SelectTrigger>
            <SelectContent>
              {staff?.filter((s) => s.isActive).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.displayName || `${s.firstName} ${s.lastName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedStaffId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Select a barber to configure hours</p>
          </CardContent>
        </Card>
      ) : loadingHours ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hours.map((h) => (
              <div
                key={h.dayOfWeek}
                className={`flex items-center gap-3 p-3 rounded-md ${
                  h.isActive ? "bg-muted/50" : "bg-muted/20 opacity-60"
                }`}
                data-testid={`row-day-${h.dayOfWeek}`}
              >
                <Switch
                  checked={h.isActive}
                  onCheckedChange={(v) => updateHour(h.dayOfWeek, "isActive", v)}
                  data-testid={`switch-day-${h.dayOfWeek}`}
                />
                <span className="w-24 text-sm font-medium">{DAYS[h.dayOfWeek]}</span>
                {h.isActive ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={h.startTime}
                      onChange={(e) => updateHour(h.dayOfWeek, "startTime", e.target.value)}
                      className="w-32"
                      data-testid={`input-start-${h.dayOfWeek}`}
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={h.endTime}
                      onChange={(e) => updateHour(h.dayOfWeek, "endTime", e.target.value)}
                      className="w-32"
                      data-testid={`input-end-${h.dayOfWeek}`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Day off</span>
                )}
              </div>
            ))}
            <Button
              className="w-full mt-4"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-hours"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

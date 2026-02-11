import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Scissors, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Service, InsertService } from "@shared/schema";

const CATEGORIES = [
  { value: "haircut", label: "Haircut" },
  { value: "shave", label: "Shave & Beard" },
  { value: "color", label: "Color" },
  { value: "styling", label: "Styling" },
  { value: "treatment", label: "Treatment" },
  { value: "combo", label: "Combo Package" },
];

const defaultForm: Partial<InsertService> = {
  name: "",
  description: "",
  durationMinutes: 30,
  priceCents: 3500,
  priceType: "fixed",
  isActive: true,
  category: "haircut",
  displayOrder: 0,
};

export default function ServicesPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<InsertService>>(defaultForm);
  const { toast } = useToast();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<InsertService>) => apiRequest("POST", "/api/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service added successfully" });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & Partial<InsertService>) =>
      apiRequest("PATCH", `/api/services/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service updated" });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setOpen(false);
    setEditId(null);
    setForm(defaultForm);
  };

  const openEdit = (service: Service) => {
    setEditId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      priceType: service.priceType || "fixed",
      isActive: service.isActive ?? true,
      category: service.category || "haircut",
      displayOrder: service.displayOrder || 0,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.durationMinutes || form.priceCents === undefined) {
      toast({ title: "Name, duration and price are required", variant: "destructive" });
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const grouped = services?.reduce((acc, s) => {
    const cat = s.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, Service[]>) || {};

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-services-title">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your barbershop services</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Service" : "Add Service"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Service Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Classic Haircut"
                  data-testid="input-service-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category || "haircut"} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={form.durationMinutes || ""}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
                    data-testid="input-duration"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={((form.priceCents || 0) / 100).toFixed(2)}
                    onChange={(e) => setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                    data-testid="input-price"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description..."
                  data-testid="input-description"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.isActive ?? true}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  data-testid="switch-service-active"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isPending}
                data-testid="button-save-service"
              >
                {isPending ? "Saving..." : editId ? "Update Service" : "Add Service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !services?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scissors className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No services added yet</p>
            <p className="text-sm text-muted-foreground">Add your first service to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const items = grouped[cat.value];
            if (!items?.length) return null;
            return (
              <div key={cat.value}>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {cat.label}
                </h2>
                <div className="space-y-2">
                  {items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((service) => (
                    <Card key={service.id} data-testid={`card-service-${service.id}`}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{service.name}</h3>
                            {!service.isActive && <Badge variant="secondary">Inactive</Badge>}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              {(service.priceCents / 100).toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {service.durationMinutes} min
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(service)} data-testid={`button-edit-service-${service.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(service.id)} data-testid={`button-delete-service-${service.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

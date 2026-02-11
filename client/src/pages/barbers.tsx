import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StaffMember, InsertStaffMember } from "@shared/schema";

const ROLES = [
  { value: "barber", label: "Barber" },
  { value: "master_barber", label: "Master Barber" },
  { value: "apprentice", label: "Apprentice" },
];

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316",
];

const defaultForm: Partial<InsertStaffMember> = {
  firstName: "",
  lastName: "",
  displayName: "",
  email: "",
  phone: "",
  role: "barber",
  bio: "",
  isActive: true,
  color: "#3B82F6",
};

export default function Barbers() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<InsertStaffMember>>(defaultForm);
  const { toast } = useToast();

  const { data: staff, isLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<InsertStaffMember>) => apiRequest("POST", "/api/staff", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Barber added successfully" });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & Partial<InsertStaffMember>) =>
      apiRequest("PATCH", `/api/staff/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Barber updated successfully" });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Barber removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setOpen(false);
    setEditId(null);
    setForm(defaultForm);
  };

  const openEdit = (member: StaffMember) => {
    setEditId(member.id);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      displayName: member.displayName || "",
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "barber",
      bio: member.bio || "",
      isActive: member.isActive ?? true,
      color: member.color || "#3B82F6",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-barbers-title">Barbers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your barber team</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-barber">
              <Plus className="w-4 h-4 mr-2" />
              Add Barber
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Barber" : "Add Barber"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input
                    value={form.firstName || ""}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input
                    value={form.lastName || ""}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input
                  value={form.displayName || ""}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Optional"
                  data-testid="input-display-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role || "barber"} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-7 h-7 rounded-md border-2 transition-all ${
                        form.color === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })}
                      data-testid={`color-${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Short bio..."
                  data-testid="input-bio"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.isActive ?? true}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  data-testid="switch-active"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isPending}
                data-testid="button-save-barber"
              >
                {isPending ? "Saving..." : editId ? "Update Barber" : "Add Barber"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !staff?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No barbers added yet</p>
            <p className="text-sm text-muted-foreground">Add your first barber to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card key={member.id} data-testid={`card-barber-${member.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback
                      style={{ backgroundColor: member.color || "#3B82F6" }}
                      className="text-white font-semibold"
                    >
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">
                        {member.displayName || `${member.firstName} ${member.lastName}`}
                      </h3>
                      {!member.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {ROLES.find((r) => r.value === member.role)?.label || member.role}
                    </Badge>
                    {member.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 mt-4 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(member)} data-testid={`button-edit-barber-${member.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(member.id)}
                    data-testid={`button-delete-barber-${member.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

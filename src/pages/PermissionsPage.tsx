import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type Student = { id: string; full_name: string; student_code: string; class_name: string };
type Permission = {
  id: string;
  student_id: string;
  reason: string;
  details: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
};

const REASONS = ["Sick", "Family Issue", "Medical Appointment", "Funeral", "Religious", "Other"];

const PermissionsPage = () => {
  const { roles } = useAuth();
  const canManage = hasAnyRole(roles, "animation_patron", "matron", "head_master", "secretary");
  const canDelete = hasAnyRole(roles, "animation_patron", "matron", "head_master");

  const [perms, setPerms] = useState<Permission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    student_id: "",
    reason: "Sick",
    details: "",
    start_date: today,
    end_date: "",
    status: "approved",
  });

  const load = async () => {
    const [p, s] = await Promise.all([
      supabase.from("student_permissions").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, full_name, student_code, class_name").order("full_name"),
    ]);
    if (p.data) setPerms(p.data as Permission[]);
    if (s.data) setStudents(s.data as Student[]);
  };

  useEffect(() => { load(); }, []);

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const submit = async () => {
    if (!form.student_id || !form.reason) {
      toast.error("Student and reason are required");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("student_permissions").insert({
      student_id: form.student_id,
      reason: form.reason,
      details: form.details || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      status: form.status,
      granted_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Permission granted");
    setOpen(false);
    setForm({ student_id: "", reason: "Sick", details: "", start_date: today, end_date: "", status: "approved" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this permission?")) return;
    const { error } = await supabase.from("student_permissions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permissions</h1>
          <p className="text-sm text-muted-foreground">Permissions for students to go home</p>
        </div>
        {canManage && <Button onClick={() => setOpen(true)}>Grant Permission</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>Permission Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
                {canDelete && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {perms.map((p) => {
                const s = studentMap[p.student_id];
                return (
                  <TableRow key={p.id}>
                    <TableCell>{s ? `${s.full_name} (${s.student_code})` : p.student_id}</TableCell>
                    <TableCell>{s?.class_name || "-"}</TableCell>
                    <TableCell>{p.reason}</TableCell>
                    <TableCell>{p.start_date}</TableCell>
                    <TableCell>{p.end_date || "-"}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell className="max-w-xs truncate">{p.details || "-"}</TableCell>
                    {canDelete && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {perms.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No permissions yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grant Permission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.student_code} ({s.class_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Details</Label>
              <Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Additional info" />
            </div>
            <Button onClick={submit} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionsPage;

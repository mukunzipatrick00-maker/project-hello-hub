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
type Record = {
  id: string;
  student_id: string;
  reason: string;
  points: number;
  notes: string | null;
  created_at: string;
};

const DisciplinePage = () => {
  const { roles } = useAuth();
  const canManage = hasAnyRole(roles, "animation_patron", "matron", "head_master", "secretary");
  const canDelete = hasAnyRole(roles, "animation_patron", "matron", "head_master");

  const [records, setRecords] = useState<Record[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", reason: "", points: "1", notes: "" });

  const load = async () => {
    const [r, s] = await Promise.all([
      supabase.from("discipline_records").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, full_name, student_code, class_name").order("full_name"),
    ]);
    if (r.data) setRecords(r.data as Record[]);
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
    const { error } = await supabase.from("discipline_records").insert({
      student_id: form.student_id,
      reason: form.reason,
      points: Number(form.points) || 1,
      notes: form.notes || null,
      recorded_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Discipline mark added");
    setOpen(false);
    setForm({ student_id: "", reason: "", points: "1", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this discipline mark?")) return;
    const { error } = await supabase.from("discipline_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discipline</h1>
          <p className="text-sm text-muted-foreground">Track student discipline marks</p>
        </div>
        {canManage && <Button onClick={() => setOpen(true)}>Add Discipline Mark</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Date</TableHead>
                {canDelete && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const s = studentMap[r.student_id];
                return (
                  <TableRow key={r.id}>
                    <TableCell>{s ? `${s.full_name} (${s.student_code})` : r.student_id}</TableCell>
                    <TableCell>{s?.class_name || "-"}</TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>{r.points}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.notes || "-"}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    {canDelete && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {records.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No records yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Discipline Mark</DialogTitle></DialogHeader>
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
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Late arrival, Fighting" />
            </div>
            <div>
              <Label>Points</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={submit} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplinePage;

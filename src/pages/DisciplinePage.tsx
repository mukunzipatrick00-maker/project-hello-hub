import { useEffect, useMemo, useState } from "react";
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

const BASELINE = 40;

type Student = { id: string; full_name: string; student_code: string; class_name: string };
type DisciplineRow = {
  id: string;
  student_id: string;
  reason: string;
  points_deducted: number;
  notes: string | null;
  created_at: string;
};

const DisciplinePage = () => {
  const { roles } = useAuth();
  const canManage = hasAnyRole(roles, "animation_patron", "matron", "head_master", "secretary");
  const canDelete = hasAnyRole(roles, "animation_patron", "matron", "head_master");

  const [records, setRecords] = useState<DisciplineRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", reason: "", points_deducted: "1", notes: "" });

  const load = async () => {
    const [r, s] = await Promise.all([
      supabase.from("discipline_records").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, full_name, student_code, class_name").order("full_name"),
    ]);
    if (r.data) setRecords(r.data as any);
    if (s.data) setStudents(s.data as Student[]);
  };

  useEffect(() => { load(); }, []);

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  // Compute remaining per student
  const remainingByStudent = useMemo(() => {
    const map: Record<string, number> = {} as any;
    for (const s of students) (map as any)[s.id] = BASELINE;
    for (const r of records) {
      (map as any)[r.student_id] = ((map as any)[r.student_id] ?? BASELINE) - Number(r.points_deducted || 0);
    }
    for (const k of Object.keys(map)) (map as any)[k] = Math.max(0, (map as any)[k]);
    return map as Record<string, number>;
  }, [records, students]);

  const submit = async () => {
    if (!form.student_id || !form.reason) {
      toast.error("Student and reason are required");
      return;
    }
    const deduct = Number(form.points_deducted) || 1;
    if (deduct <= 0) return toast.error("Deduction must be greater than 0");
    const remaining = (remainingByStudent as any)[form.student_id] ?? BASELINE;
    if (deduct > remaining) {
      return toast.error(`Student only has ${remaining} points remaining`);
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("discipline_records").insert({
      student_id: form.student_id,
      reason: form.reason,
      points_deducted: deduct,
      points: deduct, // legacy column
      notes: form.notes || null,
      recorded_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success(`Deducted ${deduct} points`);
    setOpen(false);
    setForm({ student_id: "", reason: "", points_deducted: "1", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Restore these points and remove this record?")) return;
    const { error } = await supabase.from("discipline_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Record removed, points restored");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discipline</h1>
          <p className="text-sm text-muted-foreground">Every student starts with {BASELINE} discipline points. Patron & Matron deduct points for faults.</p>
        </div>
        {canManage && <Button onClick={() => setOpen(true)}>Deduct Points</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>Student Discipline Balance</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Remaining / {BASELINE}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const rem = (remainingByStudent as any)[s.id] ?? BASELINE;
                const danger = rem <= 10;
                return (
                  <TableRow key={s.id}>
                    <TableCell>{s.full_name}</TableCell>
                    <TableCell>{s.student_code}</TableCell>
                    <TableCell>{s.class_name}</TableCell>
                    <TableCell className={`text-right font-semibold ${danger ? "text-destructive" : ""}`}>{rem}</TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No students</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Deduction History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Deducted</TableHead>
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
                    <TableCell>{r.reason}</TableCell>
                    <TableCell className="text-destructive">-{r.points_deducted}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.notes || "-"}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    {canDelete && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => remove(r.id)} title="Restore points">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {records.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No deductions yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deduct Discipline Points</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => {
                    const rem = (remainingByStudent as any)[s.id] ?? BASELINE;
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} — {s.student_code} ({s.class_name}) · {rem}/{BASELINE}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason for deduction</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Late arrival, Fighting, Skipping class" />
            </div>
            <div>
              <Label>Points to deduct</Label>
              <Input type="number" min="1" value={form.points_deducted} onChange={(e) => setForm({ ...form, points_deducted: e.target.value })} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={submit} className="w-full">Deduct Points</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplinePage;

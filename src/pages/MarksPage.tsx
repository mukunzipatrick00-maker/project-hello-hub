import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Mark = {
  id: string;
  student_id: string;
  subject: string;
  term: string;
  score: number;
  max_score: number;
  created_at: string;
};

type Student = { id: string; full_name: string; student_code: string };

const MarksPage = () => {
  const { roles } = useAuth();
  const canEnter = hasAnyRole(roles, "head_master", "secretary", "teacher");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", subject: "", term: "Term 1", score: "", max_score: "100" });

  const load = async () => {
    const [m, s] = await Promise.all([
      supabase.from("marks").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, full_name, student_code").order("full_name"),
    ]);
    if (m.error) toast.error(m.error.message);
    else setMarks((m.data ?? []) as Mark[]);
    setStudents((s.data ?? []) as Student[]);
  };

  useEffect(() => {
    document.title = "Marks | School Management";
    load();
  }, []);

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.full_name} (${s.student_code})` : id.slice(0, 8);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(form.score);
    const max = Number(form.max_score);
    if (isNaN(score) || isNaN(max) || score < 0 || score > max) {
      return toast.error("Invalid score");
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("marks").insert({
      student_id: form.student_id,
      subject: form.subject,
      term: form.term,
      score, max_score: max,
      entered_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Mark recorded");
    setOpen(false);
    setForm({ student_id: "", subject: "", term: "Term 1", score: "", max_score: "100" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marks</h1>
          <p className="text-muted-foreground text-sm">{marks.length} recorded</p>
        </div>
        {canEnter && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Enter marks</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record a mark</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Subject *</Label><Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div>
                  <Label>Term *</Label>
                  <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Score *</Label><Input type="number" required value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} /></div>
                  <div><Label>Max</Label><Input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={!form.student_id}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Marks</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{studentName(m.student_id)}</TableCell>
                  <TableCell>{m.subject}</TableCell>
                  <TableCell>{m.term}</TableCell>
                  <TableCell>{m.score} / {m.max_score}</TableCell>
                  <TableCell>{Math.round((Number(m.score) / Number(m.max_score)) * 100)}%</TableCell>
                </TableRow>
              ))}
              {marks.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No marks yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarksPage;

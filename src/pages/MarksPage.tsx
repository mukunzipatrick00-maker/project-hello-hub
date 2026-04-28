import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
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

type Student = { id: string; full_name: string; student_code: string; class_name: string };
type ClassRow = { id: string; name: string; level: string | null; trade_id: string | null };
type Subject = { id: string; name: string; trade_id: string; level: string };

const emptyForm = { student_id: "", subject: "", term: "Term 1", score: "", max_score: "100" };

const MarksPage = () => {
  const { roles } = useAuth();
  // Only teachers can record marks. Head master & secretary are view-only.
  const canEnter = hasAnyRole(roles, "teacher");
  const canDelete = hasAnyRole(roles, "head_master");

  const [marks, setMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [filterClass, setFilterClass] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogClassId, setDialogClassId] = useState<string>("");
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    const [m, s, c, sub] = await Promise.all([
      supabase.from("marks").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("id, full_name, student_code, class_name").order("full_name"),
      supabase.from("classes").select("id, name, level, trade_id").order("name"),
      supabase.from("subjects").select("id, name, trade_id, level").order("name"),
    ]);
    if (m.error) toast.error(m.error.message);
    else setMarks((m.data ?? []) as Mark[]);
    setStudents((s.data ?? []) as Student[]);
    setClasses((c.data ?? []) as ClassRow[]);
    setSubjects((sub.data ?? []) as Subject[]);
  };

  useEffect(() => {
    document.title = "Marks | School Management";
    load();
  }, []);

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.full_name} (${s.student_code})` : id.slice(0, 8);
  };
  const studentClass = (id: string) => students.find((x) => x.id === id)?.class_name ?? "—";

  // Group students by class for the main view
  const studentsByClass = useMemo(() => {
    const map = new Map<string, Student[]>();
    students.forEach((s) => {
      const arr = map.get(s.class_name) ?? [];
      arr.push(s);
      map.set(s.class_name, arr);
    });
    return map;
  }, [students]);

  const filteredMarks = useMemo(() => {
    if (!filterClass) return marks;
    const idsInClass = new Set(students.filter((s) => s.class_name === filterClass).map((s) => s.id));
    return marks.filter((m) => idsInClass.has(m.student_id));
  }, [marks, students, filterClass]);

  // Selected class in dialog drives both student list and subject list
  const selectedClass = classes.find((c) => c.id === dialogClassId) || null;
  const dialogStudents = selectedClass
    ? students.filter((s) => s.class_name === selectedClass.name)
    : [];
  const dialogSubjects = selectedClass
    ? subjects.filter(
        (sub) =>
          (selectedClass.trade_id ? sub.trade_id === selectedClass.trade_id : true) &&
          (selectedClass.level ? sub.level === selectedClass.level : true)
      )
    : [];

  const startAdd = () => {
    setEditingId(null);
    setDialogClassId("");
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const startEdit = (m: Mark) => {
    setEditingId(m.id);
    const stu = students.find((s) => s.id === m.student_id);
    const cls = stu ? classes.find((c) => c.name === stu.class_name) : null;
    setDialogClassId(cls?.id ?? "");
    setForm({
      student_id: m.student_id,
      subject: m.subject,
      term: m.term,
      score: String(m.score),
      max_score: String(m.max_score),
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogClassId) return toast.error("Select a class first");
    if (!form.student_id) return toast.error("Select a student");
    if (!form.subject) return toast.error("Select a subject");
    const score = Number(form.score);
    const max = Number(form.max_score);
    if (isNaN(score) || isNaN(max) || score < 0 || score > max) {
      return toast.error("Invalid score");
    }
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      student_id: form.student_id,
      subject: form.subject,
      term: form.term,
      score,
      max_score: max,
      entered_by: u.user?.id,
    };
    const { error } = editingId
      ? await supabase.from("marks").update(payload).eq("id", editingId)
      : await supabase.from("marks").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Mark updated" : "Mark recorded");
    setOpen(false);
    setEditingId(null);
    setDialogClassId("");
    setForm({ ...emptyForm });
    load();
  };

  const handleDelete = async (m: Mark) => {
    if (!confirm(`Delete this mark for ${studentName(m.student_id)}?`)) return;
    const { error } = await supabase.from("marks").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Mark deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Marks</h1>
          <p className="text-muted-foreground text-sm">
            {filteredMarks.length} recorded{filterClass ? ` in ${filterClass}` : ""}
          </p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="min-w-[200px]">
            <Label className="text-xs">Filter by class</Label>
            <Select value={filterClass || "__all"} onValueChange={(v) => setFilterClass(v === "__all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canEnter && <Button onClick={startAdd}>Enter marks</Button>}
        </div>
      </div>

      {!canEnter && (
        <p className="text-xs text-muted-foreground">
          View-only access. Only teachers can record marks.
        </p>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setDialogClassId(""); setForm({ ...emptyForm }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit mark" : "Record a mark"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Class *</Label>
              <Select value={dialogClassId} onValueChange={(v) => { setDialogClassId(v); setForm((f) => ({ ...f, student_id: "", subject: "" })); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.level ? ` — ${c.level}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })} disabled={!dialogClassId}>
                <SelectTrigger><SelectValue placeholder={dialogClassId ? "Select student" : "Select class first"} /></SelectTrigger>
                <SelectContent>
                  {dialogStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_code})</SelectItem>
                  ))}
                  {dialogClassId && dialogStudents.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No students in this class</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })} disabled={!dialogClassId}>
                <SelectTrigger><SelectValue placeholder={dialogClassId ? "Select subject" : "Select class first"} /></SelectTrigger>
                <SelectContent>
                  {dialogSubjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>
                  ))}
                  {dialogClassId && dialogSubjects.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No subjects configured for this class</div>
                  )}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" className="w-full" disabled={!dialogClassId || !form.student_id || !form.subject}>
              {editingId ? "Update" : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Students grouped by class — visible to staff for context */}
      {hasAnyRole(roles, "head_master", "secretary", "teacher") && (
        <Card>
          <CardHeader><CardTitle>Students by class</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[...studentsByClass.entries()]
              .filter(([cls]) => !filterClass || cls === filterClass)
              .map(([cls, list]) => (
                <div key={cls}>
                  <h3 className="font-semibold text-sm mb-1">{cls} <span className="text-muted-foreground font-normal">({list.length})</span></h3>
                  <div className="flex flex-wrap gap-1">
                    {list.map((s) => (
                      <span key={s.id} className="text-xs bg-secondary px-2 py-0.5 rounded">
                        {s.full_name} · {s.student_code}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {studentsByClass.size === 0 && (
              <p className="text-sm text-muted-foreground">No students yet</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Marks</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>%</TableHead>
                {canEnter && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarks.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{studentClass(m.student_id)}</TableCell>
                  <TableCell>{studentName(m.student_id)}</TableCell>
                  <TableCell>{m.subject}</TableCell>
                  <TableCell>{m.term}</TableCell>
                  <TableCell>{m.score} / {m.max_score}</TableCell>
                  <TableCell>{Math.round((Number(m.score) / Number(m.max_score)) * 100)}%</TableCell>
                  {canEnter && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(m)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredMarks.length === 0 && (
                <TableRow><TableCell colSpan={canEnter ? 7 : 6} className="text-center text-muted-foreground py-8">No marks yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarksPage;

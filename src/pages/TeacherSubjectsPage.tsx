import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type Assignment = { id: string; teacher_id: string; class_id: string; subject_id: string };
type Teacher = { id: string; full_name: string };
type ClassRow = { id: string; name: string; level: string | null; trade_id: string | null };
type Subject = { id: string; name: string; trade_id: string; level: string };
type Trade = { id: string; name: string };

const TeacherSubjectsPage = () => {
  const { roles } = useAuth();
  const canManage = hasAnyRole(roles, "head_master", "secretary");

  const [items, setItems] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const load = async () => {
    const [a, c, sub, t] = await Promise.all([
      supabase.from("teacher_subjects").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name, level, trade_id").order("name"),
      supabase.from("subjects").select("id, name, trade_id, level").order("name"),
      supabase.from("trades").select("id, name").order("name"),
    ]);
    if (a.error) toast.error(a.error.message);
    setItems((a.data ?? []) as Assignment[]);
    setClasses((c.data ?? []) as ClassRow[]);
    setSubjects((sub.data ?? []) as Subject[]);
    setTrades((t.data ?? []) as Trade[]);

    // Load teacher profiles
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
    const ids = (roleRows ?? []).map((r: any) => r.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setTeachers(((profs ?? []) as any[]).map((p) => ({ id: p.id, full_name: p.full_name })));
    } else {
      setTeachers([]);
    }
  };

  useEffect(() => {
    document.title = "Teacher Assignments | School Management";
    load();
  }, []);

  const selectedClass = classes.find((c) => c.id === classId) || null;
  const dialogSubjects = selectedClass
    ? subjects.filter(
        (s) =>
          (selectedClass.trade_id ? s.trade_id === selectedClass.trade_id : true) &&
          (selectedClass.level ? s.level === selectedClass.level : true)
      )
    : [];

  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.full_name ?? id.slice(0, 8);
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";
  const tradeName = (id: string | null) => trades.find((t) => t.id === id)?.name ?? "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !teacherId || !subjectId) return toast.error("All fields are required");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("teacher_subjects").insert({
      class_id: classId,
      teacher_id: teacherId,
      subject_id: subjectId,
      assigned_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Subject assigned");
    setOpen(false);
    setClassId(""); setTeacherId(""); setSubjectId("");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    const { error } = await supabase.from("teacher_subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  // Group assignments by teacher
  const byTeacher = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    items.forEach((it) => {
      const arr = map.get(it.teacher_id) ?? [];
      arr.push(it);
      map.set(it.teacher_id, arr);
    });
    return map;
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Teacher Assignments</h1>
          <p className="text-muted-foreground text-sm">Assign subjects to teachers per class & trade</p>
        </div>
        {canManage && <Button onClick={() => setOpen(true)}>Assign subject</Button>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign subject to teacher</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Class *</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.level ? ` — ${c.level}` : ""} · {tradeName(c.trade_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder={classId ? "Select subject" : "Select class first"} /></SelectTrigger>
                <SelectContent>
                  {dialogSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                  {classId && dialogSubjects.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No subjects for this class/trade/level</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher *</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                  {teachers.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No teachers registered yet</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Assign</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>All assignments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                {canManage && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{teacherName(it.teacher_id)}</TableCell>
                  <TableCell>{className(it.class_id)}</TableCell>
                  <TableCell>{subjectName(it.subject_id)}</TableCell>
                  {canManage && (
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(it.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={canManage ? 4 : 3} className="text-center text-muted-foreground py-8">No assignments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>By teacher</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[...byTeacher.entries()].map(([tid, list]) => (
            <div key={tid}>
              <h3 className="font-semibold text-sm mb-1">{teacherName(tid)} <span className="text-muted-foreground font-normal">({list.length})</span></h3>
              <div className="flex flex-wrap gap-1">
                {list.map((it) => (
                  <span key={it.id} className="text-xs bg-secondary px-2 py-0.5 rounded">
                    {subjectName(it.subject_id)} · {className(it.class_id)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {byTeacher.size === 0 && <p className="text-sm text-muted-foreground">No assignments yet</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSubjectsPage;

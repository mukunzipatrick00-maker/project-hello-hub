import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string;
  full_name: string;
  student_code: string;
  class_name: string;
  department: string | null;
  gender: string | null;
};
type Mark = { id: string; subject: string; term: string; score: number; max_score: number };
type Klass = { id: string; name: string; trade_id: string | null; level: string | null };
type TeacherAssignment = {
  id: string;
  subject: { name: string } | null;
  teacher: { full_name: string; phone: string | null; department: string | null } | null;
};

const StudentPortalPage = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [teachers, setTeachers] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "My Portal | School Management";
    if (!user) return;
    (async () => {
      // Find student record linked to this user
      const { data: s, error: sErr } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (sErr) toast.error(sErr.message);
      if (!s) { setLoading(false); return; }
      setStudent(s as Student);

      // Marks
      const { data: m } = await supabase
        .from("marks")
        .select("id, subject, term, score, max_score")
        .eq("student_id", s.id)
        .order("term");
      setMarks((m ?? []) as Mark[]);

      // Find class to get trade + level, then teachers for that class
      const { data: klass } = await supabase
        .from("classes")
        .select("id, name, trade_id, level")
        .eq("name", s.class_name)
        .maybeSingle();

      if (klass) {
        const { data: ts } = await supabase
          .from("teacher_subjects")
          .select("id, subject_id, teacher_id")
          .eq("class_id", (klass as Klass).id);

        if (ts && ts.length) {
          const subjectIds = ts.map((x: any) => x.subject_id);
          const teacherIds = ts.map((x: any) => x.teacher_id);
          const [subRes, profRes] = await Promise.all([
            supabase.from("subjects").select("id, name").in("id", subjectIds),
            supabase.from("profiles").select("id, full_name, phone, department").in("id", teacherIds),
          ]);
          const subMap = new Map((subRes.data ?? []).map((x: any) => [x.id, x]));
          const profMap = new Map((profRes.data ?? []).map((x: any) => [x.id, x]));
          setTeachers(
            ts.map((x: any) => ({
              id: x.id,
              subject: subMap.get(x.subject_id) ?? null,
              teacher: profMap.get(x.teacher_id) ?? null,
            })) as TeacherAssignment[]
          );
        }
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="text-muted-foreground">Loading your portal...</div>;

  if (!student) {
    return (
      <Card>
        <CardHeader><CardTitle>Student record not linked</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your account is not yet linked to a student record. Please contact the school office (Head Master or Secretary) to verify your student code.
        </CardContent>
      </Card>
    );
  }

  const totalScore = marks.reduce((a, m) => a + Number(m.score), 0);
  const totalMax = marks.reduce((a, m) => a + Number(m.max_score), 0);
  const avgPct = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : "—";
  const subjectsCount = new Set(marks.map((m) => m.subject)).size;

  // Best/worst subject (by avg pct)
  const subjectAgg = new Map<string, { sum: number; max: number }>();
  marks.forEach((m) => {
    const cur = subjectAgg.get(m.subject) ?? { sum: 0, max: 0 };
    cur.sum += Number(m.score);
    cur.max += Number(m.max_score);
    subjectAgg.set(m.subject, cur);
  });
  const subjectPcts = Array.from(subjectAgg.entries()).map(([s, v]) => ({
    subject: s,
    pct: v.max > 0 ? (v.sum / v.max) * 100 : 0,
  }));
  const best = subjectPcts.sort((a, b) => b.pct - a.pct)[0];
  const worst = subjectPcts.length > 1 ? subjectPcts[subjectPcts.length - 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Portal</h1>
        <p className="text-muted-foreground">Welcome, {student.full_name}</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap size={18} /> My Profile</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Full name: </span>{student.full_name}</div>
          <div><span className="text-muted-foreground">Student code: </span><span className="font-mono">{student.student_code}</span></div>
          <div><span className="text-muted-foreground">Class: </span>{student.class_name}</div>
          <div><span className="text-muted-foreground">Department: </span>{student.department ?? "—"}</div>
          <div><span className="text-muted-foreground">Gender: </span>{student.gender ?? "—"}</div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Average</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{avgPct}{avgPct !== "—" && "%"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Marks recorded</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{marks.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Subjects graded</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{subjectsCount}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">My teachers</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{teachers.length}</CardContent></Card>
      </div>

      {(best || worst) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp size={18} /> Performance highlights</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
            {best && (
              <div>
                <div className="text-muted-foreground">Best subject</div>
                <div className="font-medium">{best.subject} <Badge variant="secondary" className="ml-2">{best.pct.toFixed(1)}%</Badge></div>
              </div>
            )}
            {worst && worst.subject !== best?.subject && (
              <div>
                <div className="text-muted-foreground">Needs improvement</div>
                <div className="font-medium">{worst.subject} <Badge variant="outline" className="ml-2">{worst.pct.toFixed(1)}%</Badge></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Marks */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen size={18} /> My Marks</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((m) => {
                const pct = Number(m.max_score) > 0 ? (Number(m.score) / Number(m.max_score)) * 100 : 0;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.subject}</TableCell>
                    <TableCell>{m.term}</TableCell>
                    <TableCell>{m.score}</TableCell>
                    <TableCell>{m.max_score}</TableCell>
                    <TableCell><Badge variant={pct >= 50 ? "secondary" : "destructive"}>{pct.toFixed(1)}%</Badge></TableCell>
                  </TableRow>
                );
              })}
              {marks.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No marks recorded yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teachers */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users size={18} /> My Teachers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.subject?.name ?? "—"}</TableCell>
                  <TableCell>{t.teacher?.full_name ?? "—"}</TableCell>
                  <TableCell>{t.teacher?.department ?? "—"}</TableCell>
                  <TableCell>{t.teacher?.phone ?? "—"}</TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No teachers assigned to your class yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPortalPage;

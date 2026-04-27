import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Plus } from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string; full_name: string; student_code: string; class_name: string;
  department: string | null; gender: string | null; date_of_birth: string | null;
  parent_contact: string | null; parent_phone: string | null;
};
type Mark = { id: string; student_id: string; subject: string; term: string; score: number; max_score: number };
type Klass = { id: string; name: string; level: string | null; trade_id: string | null };
type Trade = { id: string; name: string };

const gradeFor = (p: number) => (p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "F");

const ReportCard = ({ student, marks }: { student: Student; marks: Mark[] }) => {
  const total = marks.reduce((a, m) => a + Number(m.score), 0);
  const maxTotal = marks.reduce((a, m) => a + Number(m.max_score), 0);
  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return (
    <div className="bg-background border rounded-lg p-8 print:border-0 print:p-0 print:break-after-page">
      <div className="text-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold">School Report Card</h2>
        <p className="text-sm text-muted-foreground">Academic Performance Summary</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div><span className="text-muted-foreground">Name:</span> <strong>{student.full_name}</strong></div>
        <div><span className="text-muted-foreground">Code:</span> <strong>{student.student_code}</strong></div>
        <div><span className="text-muted-foreground">Class:</span> <strong>{student.class_name}</strong></div>
        <div><span className="text-muted-foreground">Trade:</span> <strong>{student.department ?? "—"}</strong></div>
        <div><span className="text-muted-foreground">Gender:</span> <strong>{student.gender ?? "—"}</strong></div>
        <div><span className="text-muted-foreground">DOB:</span> <strong>{student.date_of_birth ?? "—"}</strong></div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>%</TableHead>
            <TableHead>Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {marks.map((m) => {
            const p = Math.round((Number(m.score) / Number(m.max_score)) * 100);
            return (
              <TableRow key={m.id}>
                <TableCell>{m.subject}</TableCell>
                <TableCell>{m.term}</TableCell>
                <TableCell>{m.score} / {m.max_score}</TableCell>
                <TableCell>{p}%</TableCell>
                <TableCell><strong>{gradeFor(p)}</strong></TableCell>
              </TableRow>
            );
          })}
          {marks.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No marks recorded</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {marks.length > 0 && (
        <div className="mt-6 flex justify-end">
          <div className="text-right space-y-1">
            <div>Total: <strong>{total} / {maxTotal}</strong></div>
            <div className="text-lg">Overall: <strong>{pct}%</strong> — Grade <strong>{gradeFor(pct)}</strong></div>
          </div>
        </div>
      )}

      <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
        <div className="border-t pt-2">Class Teacher Signature</div>
        <div className="border-t pt-2">Head Master Signature</div>
      </div>
    </div>
  );
};

type ClassRow = { student: Student; total: number; maxTotal: number; pct: number; grade: string };

const ClassSummarySheet = ({ className, rows }: { className: string; rows: ClassRow[] }) => {
  const classAvg = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length)
    : 0;
  const passed = rows.filter((r) => r.pct >= 50).length;

  return (
    <div className="bg-background border rounded-lg p-8 print:border-0 print:p-0">
      <div className="text-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold">Class Performance Summary</h2>
        <p className="text-sm text-muted-foreground">Class: <strong>{className}</strong> · {rows.length} students</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>%</TableHead>
            <TableHead>Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.student.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-medium">{r.student.full_name}</TableCell>
              <TableCell>{r.student.student_code}</TableCell>
              <TableCell>{r.total} / {r.maxTotal}</TableCell>
              <TableCell>{r.pct}%</TableCell>
              <TableCell><strong>{r.grade}</strong></TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {rows.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="border rounded p-3"><div className="text-muted-foreground">Class average</div><div className="text-xl font-bold">{classAvg}%</div></div>
          <div className="border rounded p-3"><div className="text-muted-foreground">Passed (≥50%)</div><div className="text-xl font-bold">{passed} / {rows.length}</div></div>
          <div className="border rounded p-3"><div className="text-muted-foreground">Top score</div><div className="text-xl font-bold">{Math.max(...rows.map((r) => r.pct))}%</div></div>
        </div>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const { roles, user } = useAuth();
  const canAddClass = hasAnyRole(roles, "head_master", "secretary");

  const [students, setStudents] = useState<Student[]>([]);
  const [allMarks, setAllMarks] = useState<Mark[]>([]);
  const [classRows, setClassRows] = useState<Klass[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const [mode, setMode] = useState<"individual" | "class">("individual");
  const [classView, setClassView] = useState<"summary" | "individual">("summary");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [addOpen, setAddOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", level: "", trade_id: "" });

  const loadAll = async () => {
    const [s, c, t] = await Promise.all([
      supabase.from("students").select("*").order("full_name"),
      supabase.from("classes").select("id, name, level, trade_id").order("name"),
      supabase.from("trades").select("id, name").order("name"),
    ]);
    if (s.error) toast.error(s.error.message); else setStudents((s.data ?? []) as Student[]);
    if (c.error) toast.error(c.error.message); else setClassRows((c.data ?? []) as Klass[]);
    if (t.error) toast.error(t.error.message); else setTrades((t.data ?? []) as Trade[]);
  };

  useEffect(() => {
    document.title = "Reports | School Management";
    loadAll();
  }, []);

  // Load marks for current selection
  useEffect(() => {
    if (mode === "individual") {
      if (!selectedStudent) { setAllMarks([]); return; }
      supabase.from("marks").select("*").eq("student_id", selectedStudent).order("term").then(({ data }) => {
        setAllMarks((data ?? []) as Mark[]);
      });
    } else {
      if (!selectedClass) { setAllMarks([]); return; }
      const ids = students.filter((s) => s.class_name === selectedClass).map((s) => s.id);
      if (ids.length === 0) { setAllMarks([]); return; }
      supabase.from("marks").select("*").in("student_id", ids).order("term").then(({ data }) => {
        setAllMarks((data ?? []) as Mark[]);
      });
    }
  }, [mode, selectedStudent, selectedClass, students]);

  // Merge class names from registered classes + classes referenced by existing students
  const classNames = useMemo(() => {
    const set = new Set<string>();
    classRows.forEach((c) => set.add(c.name));
    students.forEach((s) => s.class_name && set.add(s.class_name));
    return Array.from(set).sort();
  }, [classRows, students]);

  const individualStudent = students.find((x) => x.id === selectedStudent) ?? null;
  const classStudents = useMemo(
    () => students.filter((s) => s.class_name === selectedClass).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students, selectedClass]
  );

  const summaryRows: ClassRow[] = useMemo(() => {
    return classStudents.map((s) => {
      const ms = allMarks.filter((m) => m.student_id === s.id);
      const total = ms.reduce((a, m) => a + Number(m.score), 0);
      const maxTotal = ms.reduce((a, m) => a + Number(m.max_score), 0);
      const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
      return { student: s, total, maxTotal, pct, grade: gradeFor(pct) };
    });
  }, [classStudents, allMarks]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClass.name.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("classes")
      .insert({ name, level: newClass.level.trim() || null, trade_id: newClass.trade_id || null, created_by: user?.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Class added");
    setAddOpen(false);
    setNewClass({ name: "", level: "", trade_id: "" });
    await loadAll();
    setMode("class");
    setSelectedClass(data!.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Student Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and print report cards individually or by class</p>
        </div>
        {((mode === "individual" && individualStudent) || (mode === "class" && classStudents.length > 0)) && (
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            {mode === "class" ? `Print ${classView === "summary" ? "summary" : `all (${classStudents.length})`}` : "Print report"}
          </Button>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader><CardTitle>Report mode</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "individual" | "class")}>
            <TabsList>
              <TabsTrigger value="individual">Individual student</TabsTrigger>
              <TabsTrigger value="class">Whole class</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-4">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="max-w-md"><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.student_code} ({s.class_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="class" className="mt-4 space-y-3">
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-64 max-w-md">
                  <Label className="mb-1 block">Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger><SelectValue placeholder="Select a class (e.g. L3 SOD A)" /></SelectTrigger>
                    <SelectContent>
                      {classNames.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {canAddClass && (
                  <Button type="button" variant="outline" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New class
                  </Button>
                )}
              </div>

              {selectedClass && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {classStudents.length} student{classStudents.length === 1 ? "" : "s"} in {selectedClass}
                  </p>
                  <Tabs value={classView} onValueChange={(v) => setClassView(v as "summary" | "individual")}>
                    <TabsList>
                      <TabsTrigger value="summary">Class summary sheet</TabsTrigger>
                      <TabsTrigger value="individual">Individual report cards</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {mode === "individual" && individualStudent && (
        <ReportCard student={individualStudent} marks={allMarks} />
      )}

      {mode === "class" && selectedClass && classView === "summary" && (
        <ClassSummarySheet className={selectedClass} rows={summaryRows} />
      )}

      {mode === "class" && selectedClass && classView === "individual" && (
        <div className="space-y-6">
          {classStudents.map((s) => (
            <ReportCard key={s.id} student={s} marks={allMarks.filter((m) => m.student_id === s.id)} />
          ))}
          {classStudents.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No students found in {selectedClass}</CardContent></Card>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a new class</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateClass} className="space-y-3">
            <div>
              <Label>Name * (e.g. L3 SOD A)</Label>
              <Input required value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} />
            </div>
            <div>
              <Label>Trade</Label>
              <Select value={newClass.trade_id} onValueChange={(v) => setNewClass({ ...newClass, trade_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a trade" /></SelectTrigger>
                <SelectContent>
                  {trades.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Input placeholder="e.g. Level 3" value={newClass.level} onChange={(e) => setNewClass({ ...newClass, level: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Save class</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;

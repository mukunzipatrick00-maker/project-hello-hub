import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string; full_name: string; student_code: string; class_name: string;
  department: string | null; gender: string | null; date_of_birth: string | null;
  parent_contact: string | null; parent_phone: string | null;
};
type Mark = { id: string; subject: string; term: string; score: number; max_score: number };

const ReportsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);

  useEffect(() => {
    document.title = "Reports | School Management";
    supabase.from("students").select("*").order("full_name").then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setStudents((data ?? []) as Student[]);
    });
  }, []);

  useEffect(() => {
    if (!selected) { setStudent(null); setMarks([]); return; }
    const s = students.find((x) => x.id === selected) ?? null;
    setStudent(s);
    supabase.from("marks").select("*").eq("student_id", selected).order("term").then(({ data }) => {
      setMarks((data ?? []) as Mark[]);
    });
  }, [selected, students]);

  const total = marks.reduce((a, m) => a + Number(m.score), 0);
  const maxTotal = marks.reduce((a, m) => a + Number(m.max_score), 0);
  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Student Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and print report cards</p>
        </div>
        {student && (
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print report
          </Button>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader><CardTitle>Choose a student</CardTitle></CardHeader>
        <CardContent>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Select a student" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.student_code} ({s.class_name})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {student && (
        <div className="bg-background border rounded-lg p-8 print:border-0 print:p-0">
          <div className="text-center border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold">School Report Card</h2>
            <p className="text-sm text-muted-foreground">Academic Performance Summary</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <strong>{student.full_name}</strong></div>
            <div><span className="text-muted-foreground">Code:</span> <strong>{student.student_code}</strong></div>
            <div><span className="text-muted-foreground">Class:</span> <strong>{student.class_name}</strong></div>
            <div><span className="text-muted-foreground">Department:</span> <strong>{student.department ?? "—"}</strong></div>
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
                const grade = p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "F";
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.subject}</TableCell>
                    <TableCell>{m.term}</TableCell>
                    <TableCell>{m.score} / {m.max_score}</TableCell>
                    <TableCell>{p}%</TableCell>
                    <TableCell><strong>{grade}</strong></TableCell>
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
                <div className="text-lg">Overall: <strong>{pct}%</strong></div>
              </div>
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
            <div className="border-t pt-2">Class Teacher Signature</div>
            <div className="border-t pt-2">Head Master Signature</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

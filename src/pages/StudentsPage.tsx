import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type Student = {
  id: string;
  full_name: string;
  student_code: string;
  class_name: string;
  department: string | null;
  gender: string | null;
  parent_contact: string | null;
};

const StudentsPage = () => {
  const { roles } = useAuth();
  const canEdit = hasAnyRole(roles, "head_master", "secretary");
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", student_code: "", class_name: "", department: "", gender: "", parent_contact: "",
  });

  const load = async () => {
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setStudents((data ?? []) as Student[]);
  };

  useEffect(() => {
    document.title = "Students | School Management";
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("students").insert({
      full_name: form.full_name,
      student_code: form.student_code,
      class_name: form.class_name,
      department: form.department || null,
      gender: form.gender || null,
      parent_contact: form.parent_contact || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Student registered");
    setOpen(false);
    setForm({ full_name: "", student_code: "", class_name: "", department: "", gender: "", parent_contact: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm">{students.length} registered</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Register student</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register new student</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div><Label>Full name *</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Student code *</Label><Input required value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} /></div>
                <div><Label>Class *</Label><Input required value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} /></div>
                <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
                <div><Label>Gender</Label><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} /></div>
                <div><Label>Parent contact</Label><Input value={form.parent_contact} onChange={(e) => setForm({ ...form, parent_contact: e.target.value })} /></div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>All students</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Parent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                  <TableCell>{s.full_name}</TableCell>
                  <TableCell>{s.class_name}</TableCell>
                  <TableCell>{s.department ?? "—"}</TableCell>
                  <TableCell>{s.parent_contact ?? "—"}</TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsPage;

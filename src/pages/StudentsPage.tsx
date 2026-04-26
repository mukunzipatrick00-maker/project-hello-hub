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
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string;
  full_name: string;
  student_code: string;
  class_name: string;
  department: string | null;
  gender: string | null;
  parent_contact: string | null;
  parent_phone: string | null;
};
type Klass = { id: string; name: string };

const StudentsPage = () => {
  const { roles, user } = useAuth();
  const canEdit = hasAnyRole(roles, "head_master", "secretary");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", student_code: "", class_name: "", department: "", gender: "", parent_contact: "", parent_phone: "",
  });

  // Message dialog
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgStudent, setMsgStudent] = useState<Student | null>(null);
  const [msgBody, setMsgBody] = useState("");

  const load = async () => {
    const [s, c] = await Promise.all([
      supabase.from("students").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name").order("name"),
    ]);
    if (s.error) toast.error(s.error.message);
    else setStudents((s.data ?? []) as Student[]);
    setClasses((c.data ?? []) as Klass[]);
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
      parent_phone: form.parent_phone || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Student registered");
    setOpen(false);
    setForm({ full_name: "", student_code: "", class_name: "", department: "", gender: "", parent_contact: "", parent_phone: "" });
    load();
  };

  const openMessage = (s: Student) => {
    if (!s.parent_phone) {
      toast.error("No parent WhatsApp number set for this student");
      return;
    }
    setMsgStudent(s);
    setMsgBody(`Hello, this is a message from school regarding ${s.full_name}.`);
    setMsgOpen(true);
  };

  const sendWhatsApp = async () => {
    if (!msgStudent || !msgStudent.parent_phone || !msgBody.trim()) return;
    const phone = msgStudent.parent_phone.replace(/[^\d]/g, "");
    // Log it
    const { error } = await supabase.from("parent_messages").insert({
      student_id: msgStudent.id,
      to_phone: msgStudent.parent_phone,
      body: msgBody,
      status: "opened",
      sent_by: user?.id,
    });
    if (error) toast.error(`Log failed: ${error.message}`);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msgBody)}`;
    window.open(url, "_blank");
    setMsgOpen(false);
    toast.success("WhatsApp opened in new tab");
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
                <div>
                  <Label>Class *</Label>
                  {classes.length > 0 ? (
                    <Select value={form.class_name} onValueChange={(v) => setForm({ ...form, class_name: v })}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input required value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} placeholder="No classes yet — type one" />
                  )}
                </div>
                <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
                <div><Label>Gender</Label><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} /></div>
                <div><Label>Parent contact (name/notes)</Label><Input value={form.parent_contact} onChange={(e) => setForm({ ...form, parent_contact: e.target.value })} /></div>
                <div>
                  <Label>Parent WhatsApp number (with country code, e.g. +250788...)</Label>
                  <Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} placeholder="+250788123456" />
                </div>
                <Button type="submit" className="w-full" disabled={!form.class_name}>Save</Button>
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
                {canEdit && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.student_code}</TableCell>
                  <TableCell>{s.full_name}</TableCell>
                  <TableCell>{s.class_name}</TableCell>
                  <TableCell>{s.department ?? "—"}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {s.parent_contact ?? "—"}
                      {s.parent_phone && <div className="text-muted-foreground">{s.parent_phone}</div>}
                    </div>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openMessage(s)} disabled={!s.parent_phone}>
                        <MessageCircle className="h-4 w-4 mr-1" /> Message
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow><TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">No students yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message parent of {msgStudent?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">To: {msgStudent?.parent_phone}</div>
            <Textarea rows={5} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} />
            <Button className="w-full" onClick={sendWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" /> Open in WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground">
              This opens WhatsApp Web/app with the message pre-filled. Press send there to deliver.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const schema = z.object({
  student_code: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(2).max(120),
  class_name: z.string().trim().min(1).max(40),
  department: z.string().trim().max(80).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  date_of_birth: z.string().optional(),
  parent_contact: z.string().trim().max(80).optional(),
});

const StudentNew = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const allowed = roles.includes("head_master") || roles.includes("secretary");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_code: "",
    full_name: "",
    class_name: "",
    department: "",
    gender: "" as "" | "Male" | "Female" | "Other",
    date_of_birth: "",
    parent_contact: "",
  });

  if (!allowed) {
    return (
      <Card className="p-8 text-center border-border/60">
        <h2 className="font-bold mb-1">Not authorized</h2>
        <p className="text-sm text-muted-foreground">Only the Head Master or Secretary can register students.</p>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = schema.safeParse({
        ...form,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const { student_code, full_name, class_name, department, gender, date_of_birth, parent_contact } = parsed.data;
      const { error } = await supabase.from("students").insert([{
        student_code,
        full_name,
        class_name,
        department,
        gender,
        date_of_birth,
        parent_contact,
        created_by: user?.id,
      }]);
      if (error) throw error;
      toast.success("Student registered!");
      navigate("/dashboard/students");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to register student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Register a new student</h1>
      <p className="text-sm text-muted-foreground mb-6">Fill in the student's details to add them to the school records.</p>

      <Card className="p-6 border-border/60">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student_code">Student code *</Label>
              <Input id="student_code" required value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} placeholder="e.g. 2026-001" />
            </div>
            <div>
              <Label htmlFor="class_name">Class *</Label>
              <Input id="class_name" required value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} placeholder="e.g. S4 MCB" />
            </div>
          </div>

          <div>
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Sciences" />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as any })}>
                <SelectTrigger id="gender"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="parent_contact">Parent contact</Label>
              <Input id="parent_contact" value={form.parent_contact} onChange={(e) => setForm({ ...form, parent_contact: e.target.value })} placeholder="Phone or email" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-95">
              {submitting ? "Saving…" : "Register student"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/students")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StudentNew;

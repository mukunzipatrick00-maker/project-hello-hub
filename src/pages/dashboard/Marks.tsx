import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

const schema = z.object({
  student_id: z.string().uuid(),
  subject: z.string().trim().min(1).max(80),
  term: z.string().trim().min(1).max(40),
  score: z.coerce.number().min(0),
  max_score: z.coerce.number().positive(),
});

interface Student { id: string; full_name: string; student_code: string; class_name: string; }
interface Mark {
  id: string;
  subject: string;
  term: string;
  score: number;
  max_score: number;
  students: { full_name: string; student_code: string } | null;
}

const Marks = () => {
  const { user, roles } = useAuth();
  const allowed = roles.includes("teacher") || roles.includes("head_master") || roles.includes("secretary");

  const [students, setStudents] = useState<Student[]>([]);
  const [recent, setRecent] = useState<Mark[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ student_id: "", subject: "", term: "Term 1", score: "", max_score: "100" });

  const loadRecent = async () => {
    const { data } = await supabase
      .from("marks")
      .select("id, subject, term, score, max_score, students(full_name, student_code)")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecent((data as any) ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("students").select("id, full_name, student_code, class_name").order("full_name");
      setStudents(data ?? []);
    })();
    loadRecent();
  }, []);

  if (!allowed) {
    return (
      <Card className="p-8 text-center border-border/60">
        <h2 className="font-bold mb-1">Not authorized</h2>
        <p className="text-sm text-muted-foreground">Only Teachers, Head Master, or Secretary can enter marks.</p>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = schema.safeParse(form);
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
      if (parsed.data.score > parsed.data.max_score) {
        toast.error("Score cannot exceed max score");
        return;
      }
      const { error } = await supabase.from("marks").insert([{ ...parsed.data, entered_by: user?.id }]);
      if (error) throw error;
      toast.success("Mark recorded!");
      setForm({ ...form, score: "" });
      loadRecent();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save mark");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enter Marks</h1>
        <p className="text-sm text-muted-foreground">Record a student's score for a subject and term.</p>
      </div>

      {students.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border/60">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No students registered yet. Ask the secretary to register students first.</p>
        </Card>
      ) : (
        <Card className="p-6 border-border/60">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="student_id">Student *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger id="student_id"><SelectValue placeholder="Choose a student…" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} — {s.student_code} ({s.class_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <Label htmlFor="term">Term *</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger id="term"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="score">Score *</Label>
                <Input id="score" required type="number" step="0.01" min="0" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="max_score">Out of *</Label>
                <Input id="max_score" required type="number" step="0.01" min="1" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-95">
              {submitting ? "Saving…" : "Save mark"}
            </Button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="font-bold mb-3">Recent marks</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No marks recorded yet.</p>
        ) : (
          <div className="grid gap-2">
            {recent.map((m) => {
              const pct = Math.round((Number(m.score) / Number(m.max_score)) * 100);
              return (
                <Card key={m.id} className="p-4 border-border/60 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.students?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{m.subject} • {m.term}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{m.score}/{m.max_score}</div>
                    <div className={`text-xs font-semibold ${pct >= 50 ? "text-primary" : "text-destructive"}`}>{pct}%</div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marks;

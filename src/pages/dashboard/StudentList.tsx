import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Plus, Search, User } from "lucide-react";

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  class_name: string;
  department: string | null;
  gender: string | null;
}

const StudentList = () => {
  const { roles } = useAuth();
  const canAdd = roles.includes("head_master") || roles.includes("secretary");
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("students")
        .select("id, student_code, full_name, class_name, department, gender")
        .order("created_at", { ascending: false });
      setStudents(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q.toLowerCase()) ||
      s.student_code.toLowerCase().includes(q.toLowerCase()) ||
      s.class_name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">All registered students in the school.</p>
        </div>
        {canAdd && (
          <Button asChild className="bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-95">
            <Link to="/dashboard/students/new"><Plus className="w-4 h-4 mr-1" /> Register Student</Link>
          </Button>
        )}
      </div>

      <Card className="p-4 border-border/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, code or class…" className="pl-9" />
        </div>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-border/60 border-dashed">
          <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold mb-1">No students yet</h3>
          <p className="text-sm text-muted-foreground">
            {canAdd ? "Register your first student to get started." : "Ask the secretary to register students."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <Card key={s.id} className="p-4 hover:shadow-md transition-base border-border/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-warm text-primary-foreground flex items-center justify-center font-bold shadow-glow">
                {s.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.full_name}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                  <span className="font-mono">{s.student_code}</span>
                  <span>•</span>
                  <span>Class {s.class_name}</span>
                  {s.department && <><span>•</span><span>{s.department}</span></>}
                  {s.gender && <><span>•</span><span>{s.gender}</span></>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentList;

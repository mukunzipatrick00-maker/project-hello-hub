import { useEffect, useState } from "react";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, UserCog } from "lucide-react";

const Overview = () => {
  const { user, roles } = useAuth();
  const [counts, setCounts] = useState({ students: 0, marks: 0, staff: 0 });

  useEffect(() => {
    (async () => {
      const [s, m, p] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("marks").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setCounts({ students: s.count ?? 0, marks: m.count ?? 0, staff: p.count ?? 0 });
    })();
  }, []);

  const stats = [
    { icon: Users, label: "Students", value: counts.students },
    { icon: BookOpen, label: "Marks Recorded", value: counts.marks },
    { icon: UserCog, label: "Staff", value: counts.staff },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-warm text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5" /> Welcome
          </div>
          <h1 className="text-3xl font-bold mb-2">Hello, {user?.user_metadata?.full_name || user?.email}</h1>
          <p className="opacity-95">
            {roles.length
              ? `Signed in as ${roles.map((r) => ROLE_LABELS[r]).join(", ")}.`
              : "Your account has no role assigned yet — please contact the head master."}
          </p>
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-6 hover:shadow-elegant transition-base border-border/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-border/60">
        <h2 className="font-bold mb-2">What you can do</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>View all registered students.</li>
          {(roles.includes("head_master") || roles.includes("secretary")) && <li>Register new students into the system.</li>}
          {(roles.includes("teacher") || roles.includes("head_master") || roles.includes("secretary")) && (
            <li>Record marks for students by subject and term.</li>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default Overview;

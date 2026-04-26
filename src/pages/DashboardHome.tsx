import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardHome = () => {
  const { user, roles, department } = useAuth();
  const [stats, setStats] = useState({ students: 0, marks: 0, staff: 0 });

  useEffect(() => {
    document.title = "Dashboard | School Management";
    (async () => {
      const [s, m, st] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("marks").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setStats({ students: s.count ?? 0, marks: m.count ?? 0, staff: st.count ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h1>
        <p className="text-muted-foreground">
          {department && `${department} · `}
          {roles.map((r) => ROLE_LABELS[r]).join(", ") || "No role assigned yet"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Students</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.students}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Marks recorded</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.marks}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Staff accounts</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.staff}</CardContent>
        </Card>
      </div>
      {roles.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Your account has no role yet. Ask the Head Master or Secretary to assign one so you can access more features.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHome;

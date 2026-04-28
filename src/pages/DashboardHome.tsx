import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, hasAnyRole } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DashboardHome = () => {
  const { user, roles, department } = useAuth();
  const [stats, setStats] = useState({ students: 0, marks: 0, staff: 0 });
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const isHeadMaster = hasAnyRole(roles, "head_master");

  useEffect(() => {
    document.title = "Dashboard | School Management";
    (async () => {
      const [s, m, st] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("marks").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setStats({ students: s.count ?? 0, marks: m.count ?? 0, staff: st.count ?? 0 });
      const { data: ss } = await (supabase as any)
        .from("school_settings")
        .select("school_code")
        .maybeSingle();
      if (ss?.school_code) setSchoolCode(ss.school_code);
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
      {isHeadMaster && (
        <Card>
          <CardHeader><CardTitle className="text-sm">School Code</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-bold tracking-wider">{schoolCode ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">Students need this code to sign up.</p>
            </div>
            <Button asChild variant="outline"><Link to="/dashboard/settings">Change</Link></Button>
          </CardContent>
        </Card>
      )}
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

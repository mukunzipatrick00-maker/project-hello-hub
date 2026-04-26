import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "head_master" | "secretary" | "teacher" | "animation_patron" | "matron" | "student";

export const ROLE_LABELS: Record<AppRole, string> = {
  head_master: "Head Master",
  secretary: "Secretary",
  teacher: "Teacher",
  animation_patron: "Animation Patron",
  matron: "Matron",
  student: "Student",
};

export const DEPARTMENTS = [
  "Administration",
  "Sciences",
  "Languages",
  "Arts",
  "Sports",
  "Welfare",
  "Student",
];

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setRoles([]);
        setDepartment(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Defer to avoid deadlock with onAuthStateChange
    setTimeout(async () => {
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("department").eq("id", user.id).maybeSingle(),
      ]);
      setRoles((rolesRes.data?.map((r: any) => r.role) ?? []) as AppRole[]);
      setDepartment(profileRes.data?.department ?? null);
    }, 0);
  }, [user]);

  return { session, user, roles, department, loading };
}

export const hasAnyRole = (roles: AppRole[], ...allowed: AppRole[]) =>
  roles.some((r) => allowed.includes(r));

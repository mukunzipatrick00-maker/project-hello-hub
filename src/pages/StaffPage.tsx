import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, type AppRole, useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type StaffRow = {
  id: string;
  full_name: string;
  department: string | null;
  phone: string | null;
  roles: AppRole[];
};

const ALL_ROLES: AppRole[] = ["head_master", "secretary", "teacher", "animation_patron", "matron", "student"];

const StaffPage = () => {
  const { user, roles } = useAuth();
  const canDelete = hasAnyRole(roles, "head_master");
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [adding, setAdding] = useState<Record<string, AppRole | "">>({});

  const load = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, department, phone").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.error) return toast.error(profilesRes.error.message);
    const map = new Map<string, AppRole[]>();
    (rolesRes.data ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      map.set(r.user_id, arr);
    });
    setRows(
      (profilesRes.data ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        department: p.department,
        phone: p.phone,
        roles: map.get(p.id) ?? [],
      })),
    );
  };

  useEffect(() => {
    document.title = "Staff | School Management";
    load();
  }, []);

  const assignRole = async (userId: string) => {
    const role = adding[userId];
    if (!role) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success(`Assigned ${ROLE_LABELS[role]}`);
    setAdding({ ...adding, [userId]: "" });
    load();
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return toast.error(error.message);
    toast.success("Role removed");
    load();
  };

  const deleteUser = async (r: StaffRow) => {
    if (r.id === user?.id) return toast.error("You cannot delete your own account");
    if (!confirm(`Permanently delete ${r.full_name}? This removes their account, profile, and roles. This cannot be undone.`)) return;
    const { data, error } = await supabase.functions.invoke("delete-user", { body: { user_id: r.id } });
    if (error) return toast.error(error.message);
    if ((data as any)?.error) return toast.error((data as any).error);
    toast.success("User deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff & Roles</h1>
        <p className="text-muted-foreground text-sm">
          Manage roles for everyone with an account. New users sign up themselves; you assign their role here.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>All accounts ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Assign role</TableHead>
                {canDelete && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell>{r.department ?? "—"}</TableCell>
                  <TableCell>{r.phone ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                      {r.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => removeRole(r.id, role)}
                          className="text-xs bg-secondary hover:bg-destructive hover:text-destructive-foreground px-2 py-0.5 rounded transition-colors"
                          title="Click to remove"
                        >
                          {ROLE_LABELS[role]} ×
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select value={adding[r.id] ?? ""} onValueChange={(v) => setAdding({ ...adding, [r.id]: v as AppRole })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Pick role" /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.filter((role) => !r.roles.includes(role)).map((role) => (
                            <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => assignRole(r.id)} disabled={!adding[r.id]}>Add</Button>
                    </div>
                  </TableCell>
                  {canDelete && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(r)}
                        disabled={r.id === user?.id}
                        title={r.id === user?.id ? "You cannot delete yourself" : "Delete user"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPage;

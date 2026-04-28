import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SchoolSettingsPage = () => {
  const { roles, user } = useAuth();
  const isHeadMaster = hasAnyRole(roles, "head_master");
  const [code, setCode] = useState("");
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "School Settings | School Management System";
    (async () => {
      const { data } = await (supabase as any)
        .from("school_settings")
        .select("id, school_code")
        .maybeSingle();
      if (data) {
        setRowId(data.id);
        setCode(data.school_code);
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!code.trim()) return toast.error("School code is required");
    setSaving(true);
    if (rowId) {
      const { error } = await (supabase as any)
        .from("school_settings")
        .update({ school_code: code.trim(), updated_by: user?.id })
        .eq("id", rowId);
      if (error) toast.error(error.message);
      else toast.success("School code updated");
    } else {
      const { data, error } = await (supabase as any)
        .from("school_settings")
        .insert({ school_code: code.trim(), updated_by: user?.id })
        .select()
        .single();
      if (error) toast.error(error.message);
      else {
        setRowId(data.id);
        toast.success("School code saved");
      }
    }
    setSaving(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School Settings</h1>
        <p className="text-muted-foreground">The school code is required for students to sign up.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>School Code</CardTitle>
          <CardDescription>
            {isHeadMaster
              ? "Only the Head Master can change this value."
              : "Read-only. Ask the Head Master to change it."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current school code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!isHeadMaster}
              placeholder="e.g. 1177223"
            />
          </div>
          {isHeadMaster && (
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolSettingsPage;

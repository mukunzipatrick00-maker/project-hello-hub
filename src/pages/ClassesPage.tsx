import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type Klass = { id: string; name: string; level: string | null; description: string | null };

const ClassesPage = () => {
  const { roles, user } = useAuth();
  const canEdit = hasAnyRole(roles, "head_master", "secretary");
  const [classes, setClasses] = useState<Klass[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", level: "", description: "" });

  const load = async () => {
    const { data, error } = await supabase.from("classes").select("*").order("name");
    if (error) toast.error(error.message);
    else setClasses((data ?? []) as Klass[]);
  };

  useEffect(() => {
    document.title = "Classes | School Management";
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("classes").insert({
      name: form.name.trim(),
      level: form.level.trim() || null,
      description: form.description.trim() || null,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Class added");
    setOpen(false);
    setForm({ name: "", level: "", description: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm">{classes.length} classes</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Add class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a new class</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div><Label>Name * (e.g. S1A)</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Level</Label><Input placeholder="e.g. Senior 1" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>All classes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.level ?? "—"}</TableCell>
                  <TableCell>{c.description ?? "—"}</TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No classes yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassesPage;

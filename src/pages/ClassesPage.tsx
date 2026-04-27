import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Trade = { id: string; name: string };
type Klass = { id: string; name: string; level: string | null; description: string | null; trade_id: string | null };

const emptyForm = { name: "", level: "", description: "", trade_id: "" };

const ClassesPage = () => {
  const { roles, user } = useAuth();
  const canEdit = hasAnyRole(roles, "head_master", "secretary");
  const canDelete = hasAnyRole(roles, "head_master");
  const [classes, setClasses] = useState<Klass[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    const [{ data: cls, error: e1 }, { data: trs, error: e2 }] = await Promise.all([
      supabase.from("classes").select("*").order("name"),
      supabase.from("trades").select("id, name").order("name"),
    ]);
    if (e1) toast.error(e1.message); else setClasses((cls ?? []) as Klass[]);
    if (e2) toast.error(e2.message); else setTrades((trs ?? []) as Trade[]);
  };

  useEffect(() => {
    document.title = "Classes | TVET School Management";
    load();
  }, []);

  const tradeName = (id: string | null) => trades.find((t) => t.id === id)?.name ?? "—";

  const startAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setOpen(true); };
  const startEdit = (c: Klass) => {
    setEditingId(c.id);
    setForm({ name: c.name, level: c.level ?? "", description: c.description ?? "", trade_id: c.trade_id ?? "" });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      level: form.level.trim() || null,
      description: form.description.trim() || null,
      trade_id: form.trade_id || null,
    };
    const { error } = editingId
      ? await supabase.from("classes").update(payload).eq("id", editingId)
      : await supabase.from("classes").insert({ ...payload, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Class updated" : "Class added");
    setOpen(false); setEditingId(null); setForm({ ...emptyForm });
    load();
  };

  const handleDelete = async (c: Klass) => {
    if (!confirm(`Delete class ${c.name}?`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm">{classes.length} classes</p>
        </div>
        {canEdit && <Button onClick={startAdd}>Add class</Button>}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit class" : "Add a new class"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Name * (e.g. L3 SOD A)</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Trade</Label>
              <Select value={form.trade_id} onValueChange={(v) => setForm({ ...form, trade_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a trade" /></SelectTrigger>
                <SelectContent>
                  {trades.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trades.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No trades yet. Add trades on the Trades page first.</p>
              )}
            </div>
            <div><Label>Level</Label><Input placeholder="e.g. Level 3" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button type="submit" className="w-full">{editingId ? "Update" : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>All classes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Description</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{tradeName(c.trade_id)}</TableCell>
                  <TableCell>{c.level ?? "—"}</TableCell>
                  <TableCell>{c.description ?? "—"}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(c)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow><TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground py-8">No classes yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassesPage;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Trade = { id: string; name: string; code: string | null; description: string | null };
const emptyForm = { name: "", code: "", description: "" };

const TradesPage = () => {
  const { roles, user } = useAuth();
  const canEdit = hasAnyRole(roles, "head_master", "secretary");
  const canDelete = hasAnyRole(roles, "head_master");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    const { data, error } = await supabase.from("trades").select("*").order("name");
    if (error) toast.error(error.message);
    else setTrades((data ?? []) as Trade[]);
  };

  useEffect(() => {
    document.title = "Trades | TVET School Management";
    load();
  }, []);

  const startAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setOpen(true); };
  const startEdit = (t: Trade) => {
    setEditingId(t.id);
    setForm({ name: t.name, code: t.code ?? "", description: t.description ?? "" });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("trades").update(payload).eq("id", editingId)
      : await supabase.from("trades").insert({ ...payload, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Trade updated" : "Trade added");
    setOpen(false); setEditingId(null); setForm({ ...emptyForm });
    load();
  };

  const handleDelete = async (t: Trade) => {
    if (!confirm(`Delete trade ${t.name}?`)) return;
    const { error } = await supabase.from("trades").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Trade deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trades</h1>
          <p className="text-muted-foreground text-sm">{trades.length} trades offered at the school</p>
        </div>
        {canEdit && <Button onClick={startAdd}>Add trade</Button>}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit trade" : "Add a new trade"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Name *</Label><Input required placeholder="e.g. Software Development" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Code</Label><Input placeholder="e.g. SOD" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button type="submit" className="w-full">{editingId ? "Update" : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>All trades</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.code ?? "—"}</TableCell>
                  <TableCell>{t.description ?? "—"}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        {canDelete && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(t)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {trades.length === 0 && (
                <TableRow><TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground py-8">No trades yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradesPage;

import { useEffect, useMemo, useState } from "react";
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

type Trade = { id: string; name: string; code: string | null };
type Subject = {
  id: string;
  trade_id: string;
  level: string;
  name: string;
  code: string | null;
  description: string | null;
};

const LEVELS = ["L3", "L4", "L5"];
const emptyForm = { trade_id: "", level: "L4", name: "", code: "", description: "" };

const SubjectsPage = () => {
  const { roles, user } = useAuth();
  const canEdit = hasAnyRole(roles, "head_master", "secretary");
  const canDelete = hasAnyRole(roles, "head_master");

  const [trades, setTrades] = useState<Trade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterTrade, setFilterTrade] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    const [t, s] = await Promise.all([
      supabase.from("trades").select("id, name, code").order("name"),
      supabase.from("subjects").select("*").order("level").order("name"),
    ]);
    if (t.error) toast.error(t.error.message);
    else setTrades((t.data ?? []) as Trade[]);
    if (s.error) toast.error(s.error.message);
    else setSubjects((s.data ?? []) as Subject[]);
  };

  useEffect(() => {
    document.title = "Subjects | TVET School Management";
    load();
  }, []);

  const tradeName = (id: string) => trades.find((t) => t.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    return subjects.filter(
      (s) =>
        (filterTrade === "all" || s.trade_id === filterTrade) &&
        (filterLevel === "all" || s.level === filterLevel)
    );
  }, [subjects, filterTrade, filterLevel]);

  const startAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      trade_id: filterTrade !== "all" ? filterTrade : "",
      level: filterLevel !== "all" ? filterLevel : "L4",
    });
    setOpen(true);
  };

  const startEdit = (s: Subject) => {
    setEditingId(s.id);
    setForm({
      trade_id: s.trade_id,
      level: s.level,
      name: s.name,
      code: s.code ?? "",
      description: s.description ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trade_id) return toast.error("Select a trade");
    const payload = {
      trade_id: form.trade_id,
      level: form.level,
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("subjects").update(payload).eq("id", editingId)
      : await supabase.from("subjects").insert({ ...payload, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Subject updated" : "Subject added");
    setOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    load();
  };

  const handleDelete = async (s: Subject) => {
    if (!confirm(`Delete subject ${s.name}?`)) return;
    const { error } = await supabase.from("subjects").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Subject deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} subject{filtered.length === 1 ? "" : "s"} shown
          </p>
        </div>
        {canEdit && <Button onClick={startAdd}>Add subject</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="min-w-[220px]">
            <Label>Trade</Label>
            <Select value={filterTrade} onValueChange={setFilterTrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trades</SelectItem>
                {trades.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}{t.code ? ` (${t.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Label>Level</Label>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit subject" : "Add a new subject"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Trade *</Label>
              <Select value={form.trade_id} onValueChange={(v) => setForm({ ...form, trade_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                <SelectContent>
                  {trades.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{t.code ? ` (${t.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level *</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject name *</Label>
              <Input
                required
                placeholder="e.g. Wide Area Network"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Code</Label>
              <Input
                placeholder="e.g. WAN"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">{editingId ? "Update" : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{tradeName(s.trade_id)}</TableCell>
                  <TableCell>{s.level}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.code ?? "—"}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(s)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground py-8">
                    No subjects yet. {canEdit && "Click \"Add subject\" to create one."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectsPage;

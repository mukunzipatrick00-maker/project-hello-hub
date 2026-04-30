import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, hasAnyRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, GraduationCap, ClipboardList, UserCog, LogOut, BookOpen, FileText, Briefcase, Settings, Library, UserCheck } from "lucide-react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, roles, department } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const isStaff = hasAnyRole(roles, "head_master", "secretary", "teacher", "animation_patron", "matron");
  const canManageStudents = hasAnyRole(roles, "head_master", "secretary");
  const canViewStudents = hasAnyRole(roles, "head_master", "secretary", "teacher");
  const canEnterMarks = hasAnyRole(roles, "head_master", "secretary", "teacher");
  const canManageStaff = hasAnyRole(roles, "head_master", "secretary");
  const canSeeReports = hasAnyRole(roles, "head_master", "secretary");
  const canAssignTeachers = hasAnyRole(roles, "head_master", "secretary");
  const isStudent = hasAnyRole(roles, "student");

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
    }`;

  return (
    <div className="min-h-screen flex bg-muted/20">
      <aside className="w-64 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <Link to="/dashboard" className="font-bold text-lg">School System</Link>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
          {department && <p className="text-xs text-muted-foreground">{department}</p>}
          <div className="flex flex-wrap gap-1 mt-2">
            {roles.length === 0 && <span className="text-xs text-muted-foreground">No role assigned</span>}
            {roles.map((r) => (
              <span key={r} className="text-[10px] bg-secondary px-2 py-0.5 rounded">{ROLE_LABELS[r]}</span>
            ))}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <NavLink to="/dashboard" end className={linkCls}>
            <LayoutDashboard size={16} /> Overview
          </NavLink>
          {(isStaff || isStudent) && (
            <NavLink to="/dashboard/marks" className={linkCls}>
              <ClipboardList size={16} /> Marks
            </NavLink>
          )}
          {canViewStudents && (
            <NavLink to="/dashboard/students" className={linkCls}>
              <GraduationCap size={16} /> Students
            </NavLink>
          )}
          {canManageStudents && (
            <NavLink to="/dashboard/classes" className={linkCls}>
              <BookOpen size={16} /> Classes
            </NavLink>
          )}
          {canManageStudents && (
            <NavLink to="/dashboard/trades" className={linkCls}>
              <Briefcase size={16} /> Trades
            </NavLink>
          )}
          {(isStaff || isStudent) && (
            <NavLink to="/dashboard/subjects" className={linkCls}>
              <Library size={16} /> Subjects
            </NavLink>
          )}
          {canAssignTeachers && (
            <NavLink to="/dashboard/teacher-subjects" className={linkCls}>
              <UserCheck size={16} /> Teacher Assignments
            </NavLink>
          )}
          {canSeeReports && (
            <NavLink to="/dashboard/reports" className={linkCls}>
              <FileText size={16} /> Reports
            </NavLink>
          )}
          {canManageStaff && (
            <NavLink to="/dashboard/staff" className={linkCls}>
              <UserCog size={16} /> Staff
            </NavLink>
          )}
          {hasAnyRole(roles, "head_master", "secretary") && (
            <NavLink to="/dashboard/settings" className={linkCls}>
              <Settings size={16} /> School Settings
            </NavLink>
          )}
        </nav>
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

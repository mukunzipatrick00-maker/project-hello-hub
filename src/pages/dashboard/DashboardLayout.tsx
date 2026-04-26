import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, Users, BookOpen, LogOut } from "lucide-react";

const DashboardLayout = () => {
  const { user, roles, signOut } = useAuth();

  const canManageStudents = roles.includes("head_master") || roles.includes("secretary");
  const canEnterMarks = roles.includes("teacher") || roles.includes("head_master") || roles.includes("secretary");

  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview", show: true },
    { to: "/dashboard/students", icon: Users, label: "Students", show: true },
    { to: "/dashboard/students/new", icon: Users, label: "Register Student", show: canManageStudents },
    { to: "/dashboard/marks", icon: BookOpen, label: "Enter Marks", show: canEnterMarks },
  ].filter((l) => l.show);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center shadow-glow">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">School Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user?.email}</div>
              <div className="text-xs text-muted-foreground">
                {roles.length ? roles.map((r) => ROLE_LABELS[r]).join(", ") : "No role assigned"}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 h-fit">
          <nav className="bg-card border border-border rounded-xl p-2 shadow-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-base ${
                    isActive ? "bg-gradient-warm text-primary-foreground shadow-glow" : "hover:bg-muted text-foreground"
                  }`
                }
              >
                <l.icon className="w-4 h-4" /> {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="animate-fade-in min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

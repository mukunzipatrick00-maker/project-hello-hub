import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "School Management System";
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/20 flex items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap size={32} />
        </div>
        <h1 className="text-5xl font-bold">School Management System</h1>
        <p className="text-lg text-muted-foreground">
          A unified platform for the Head Master, Secretary, Teachers, Animation Patrons, Matrons and Students.
          Register students, manage staff and track marks — all in one place.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg"><Link to="/auth">Login</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth?tab=signup">Create account</Link></Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

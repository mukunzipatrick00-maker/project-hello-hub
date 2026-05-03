import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import studentClass from "@/assets/student-class.jpg";

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
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="rounded-2xl overflow-hidden shadow-xl border">
          <img
            src={studentClass}
            alt="Rwandan school student writing in class with a pen"
            width={1920}
            height={1080}
            className="w-full h-auto object-cover"
          />
        </div>
        <div className="text-center md:text-left space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap size={32} />
        </div>
        <h1 className="text-5xl font-bold">Rwanda School Management System</h1>
        <p className="text-lg text-muted-foreground">
          Our spirit is to give pure education to every child of our country. Built for the
          Head Master, Secretary, Teachers, Animation Patrons, Matrons and Students to work as one family
          for the future of Rwanda.
        </p>

        <div className="grid md:grid-cols-3 gap-4 text-left pt-4">
          <div className="p-5 rounded-xl bg-card/80 backdrop-blur border">
            <h2 className="font-semibold mb-2">Our Mission</h2>
            <p className="text-sm text-muted-foreground">
              To deliver quality, inclusive and competence-based education that empowers
              every Rwandan child with knowledge, skills and values for a prosperous nation.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-card/80 backdrop-blur border">
            <h2 className="font-semibold mb-2">Our Vision</h2>
            <p className="text-sm text-muted-foreground">
              A Rwanda where every learner becomes a confident, creative and patriotic
              citizen, ready to build a knowledge-based society and serve humanity.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-card/80 backdrop-blur border">
            <h2 className="font-semibold mb-2">Our Values</h2>
            <p className="text-sm text-muted-foreground">
              Integrity, discipline, unity, hard work and love for the country —
              the true Rwandan spirit guiding our schools every single day.
            </p>
          </div>
        </div>

        <p className="text-base text-muted-foreground pt-2 max-w-xl mx-auto">
          Education is the foundation of Rwanda's transformation. Together — teachers, parents
          and students — we nurture young minds to become the leaders of tomorrow. 🇷🇼
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

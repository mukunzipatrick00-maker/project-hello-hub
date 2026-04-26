import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Award, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

const features = [
  { icon: Users, title: "Staff Management", desc: "Register and manage Head Master, Secretary, Teachers, Patrons & Matrons." },
  { icon: BookOpen, title: "Student Records", desc: "Keep complete student profiles by class and department." },
  { icon: Award, title: "Marks & Grades", desc: "Teachers record scores per subject and term, securely stored." },
  { icon: Shield, title: "Role-Based Access", desc: "Each department sees only what they need to do their job." },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center shadow-glow">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">School Portal</span>
          </Link>
          <Button asChild variant="default" className="bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-95 transition-base">
            <Link to={user ? "/dashboard" : "/auth"}>
              {user ? "Dashboard" : "Sign in"} <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-warm opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-warm opacity-20 blur-3xl" />

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-6">
              🎓 School Management System
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              One portal for your <span className="bg-gradient-warm bg-clip-text text-transparent">whole school</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              From the Head Master's office to the classroom — register staff, manage students, and record marks all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-95 transition-base">
                <Link to="/auth">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Learn more</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for every role</h2>
            <p className="text-muted-foreground">A simple, role-based system that fits your school's structure.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="p-6 hover:shadow-elegant transition-base border-border/60 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-base">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="overflow-hidden border-0 shadow-elegant">
            <div className="bg-gradient-warm p-12 md:p-16 text-center text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to bring your school online?</h2>
              <p className="text-lg opacity-95 mb-8 max-w-xl mx-auto">
                Create your first staff account and start managing your school today.
              </p>
              <Button asChild size="lg" variant="secondary" className="shadow-md hover:scale-105 transition-base">
                <Link to="/auth">Create an account</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} School Portal. Built for educators.
        </div>
      </footer>
    </div>
  );
};

export default Index;

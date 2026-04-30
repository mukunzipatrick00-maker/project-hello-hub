import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginDept, setLoginDept] = useState<string>("");

  // Signup state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [signupDept, setSignupDept] = useState<string>("");

  // Student signup state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the password reset link.");
    setForgotOpen(false);
    setForgotEmail("");
  };

  useEffect(() => {
    document.title = "Login | School Management System";
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard", { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupDept) {
      toast.error("Please select your department");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: name,
          phone,
          department: signupDept,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Please check your email to confirm, then ask the Head Master to assign your role.");
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1) Verify school code
    const { data: schoolOk, error: scErr } = await (supabase as any).rpc("verify_school_code", { _code: schoolCode.trim() });
    if (scErr || !schoolOk) {
      setLoading(false);
      toast.error("Invalid school code. Ask the school office for the correct code.");
      return;
    }
    // 2) Verify student code exists
    const { data: studentOk, error: stErr } = await (supabase as any).rpc("verify_student_code", { _code: studentCode.trim() });
    if (stErr || !studentOk) {
      setLoading(false);
      toast.error("Student code not found. Make sure the school registered you first.");
      return;
    }

    // 3) Create the auth account
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: studentEmail,
      password: studentPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: studentName,
          department: "Student",
          role: "student",
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // 4) Try to link account to student record (works only after sign-in completes if email confirmation off)
    if (signUpData.user) {
      await (supabase as any)
        .from("students")
        .update({ user_id: signUpData.user.id })
        .eq("student_code", studentCode.trim());
    }

    setLoading(false);
    toast.success("Student account created. Check your email to confirm, then sign in.");
  };


  const tab = params.get("tab") === "signup" ? "signup" : "login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">School Management System</CardTitle>
          <CardDescription>Sign in or create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={tab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(loginEmail); setForgotOpen(true); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={signupDept} onValueChange={setSignupDept}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password (min 6)</Label>
                  <Input id="signup-password" type="password" minLength={6} required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Sign up"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  After signup, the Head Master or Secretary will assign your role.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="student">
              <form onSubmit={handleStudentSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Full name</Label>
                  <Input id="s-name" required value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-school-code">School code</Label>
                  <Input id="s-school-code" required value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} placeholder="Provided by your school" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-student-code">Your student code</Label>
                  <Input id="s-student-code" required value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder="e.g. STU001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-email">Email</Label>
                  <Input id="s-email" type="email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-password">Password (min 6)</Label>
                  <Input id="s-password" type="password" minLength={6} required value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Create student account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We verify both codes against the school records before creating your account.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll send you a link to set a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={forgotLoading}>
              {forgotLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;

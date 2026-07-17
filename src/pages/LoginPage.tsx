import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setIsForgot(false);
        }
        return;
      }

      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
          return;
        }
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <button onClick={() => navigate("/")} className="absolute top-4 left-4 z-10 flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors lg:text-sidebar-foreground/70">
        <Home className="h-4 w-4" /> Home
      </button>
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-secondary-foreground flex-col justify-center items-center p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <img src="/assets/logo-aurapte.png" alt="AuraPTE Logo" className="h-32 lg:h-40 w-auto object-contain mx-auto mb-8 drop-shadow-2xl" />
          <h1 className="text-3xl font-bold mb-4">Welcome Back</h1>
          <p className="text-sidebar-muted text-sm">
            Practice all 20 PTE question types with AI-powered scoring. Join thousands of students preparing for their PTE exam.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            {["AI Scoring", "20 Question Types", "Free Practice", "Score Analytics"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-sidebar-foreground">
                <div className="h-2 w-2 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center mb-10">
            <img src="/assets/logo-aurapte.png" alt="AuraPTE Logo" className="h-24 w-auto object-contain drop-shadow-lg" />
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            {isForgot ? "Reset Password" : isSignUp ? "Create account" : "Sign in"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {isForgot ? "Enter your email to receive a reset link" : isSignUp ? "Start your PTE preparation journey" : "Welcome back! Continue your practice"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgot && (
              <div>
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input className="mt-1" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            {!isForgot && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  {!isSignUp && (
                    <button type="button" onClick={() => setIsForgot(true)} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"} {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {isForgot ? (
              <button onClick={() => setIsForgot(false)} className="text-sm text-primary hover:underline">
                Back to sign in
              </button>
            ) : (
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline">
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;

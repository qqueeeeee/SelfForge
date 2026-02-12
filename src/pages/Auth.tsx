import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
	const location = useLocation();

	const from = (location.state as any)?.from || '/';

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

		const formDetails = new URLSearchParams();
		formDetails.append('username', email);
		formDetails.append('password', password);

    try {
      /**
       * Future Backend Integration:
       * Replace Supabase auth with custom endpoints:
       * - POST /api/auth/login for sign in
       * - POST /api/auth/register for sign up
       * - POST /api/auth/logout for sign out
       */
      if (isLogin) {
        const response = await fetch('http://localhost:8000/token', {
					method: "POST",
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: formDetails, 
        });
				console.log(formDetails);
				if (response.ok) {
					const data = await response.json();
					localStorage.setItem('token', data.access_token);			
				
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
				} else {
					const errorData = await response.json();
					throw new Error(errorData.detail || "Login failed"); 
				}
        navigate(from, { replace: true });

      } else {
        const response = await fetch('http://localhost:8000/register', {
					method: "POST",
					headers: { 
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						email: email,
						password: password,
					}),
        });
        if (!response.ok) { 
					const errorData = await response.json();
					throw new Error(errorData.detail || "Registration Failed");
				}

        toast({
          title: "Welcome to SelfForge!",
          description: "Your account has been created successfully.",
        });

				setIsLogin(true);
      }
    } catch (error: any) {
      let title = "Authentication Error";
      let message = error.message || "An error occurred during authentication.";
      
      if (error.message?.includes("User already registered")) {
        title = "Account Exists";
        message = "This email is already registered. Please sign in instead.";
      } else if (error.message?.includes("401 Unauthorized")) {
        title = "Invalid Credentials";
        message = "The email or password you entered is incorrect.";
      } else if (error.message?.includes("Email not confirmed")) {
        title = "Email Not Verified";
        message = "Please check your email and verify your account.";
      } else if (error.message?.includes("Too many requests")) {
        title = "Too Many Attempts";
        message = "Please wait a moment before trying again.";
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        title = "Connection Error";
        message = "Unable to connect. Please check your internet connection.";
     }
      
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">SF</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">SelfForge</h1>
          <p className="text-muted-foreground mt-2">Personal AI Habit Tracker</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Enter your credentials to access your dashboard"
                : "Start your journey to better habits"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

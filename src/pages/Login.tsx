import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Loader2, Mail, Lock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login('admin', email, password);
      toast({ title: "Welcome, Admin", description: "Successfully logged in." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login('collector', email, password);
      toast({ title: "Welcome, Collector", description: "Successfully logged in." });
      navigate("/collector");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHouseholdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login('household', email, password);
      toast({ title: "Welcome", description: "Household data loaded." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    try {
      await api.requestOTP(forgotEmail);
      toast({ title: "OTP Sent", description: "If the email exists, an OTP has been sent to it." });
      setStep(2);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    try {
      await api.resetPasswordWithOTP(forgotEmail, otpCode, newPassword);
      toast({ title: "Success", description: "Password reset. You can now login." });
      setIsForgotOpen(false);
      setStep(1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="text-green-600">Green</span>-link</h1>
          <p className="text-muted-foreground mt-2">Smart Waste Management System</p>
        </div>

        <Tabs defaultValue="household" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="household">Household</TabsTrigger>
            <TabsTrigger value="collector">Collector</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="household">
            <Card>
              <CardHeader>
                <CardTitle>Household Login</CardTitle>
                <CardDescription>Enter registered email and password.</CardDescription>
              </CardHeader>
              <form onSubmit={handleHouseholdLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="house-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="house-email" type="email" placeholder="Email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="house-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="house-password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login as Resident
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="collector">
            <Card>
              <CardHeader>
                <CardTitle>Collector Login</CardTitle>
                <CardDescription>Enter official credentials.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCollectorLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coll-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="coll-email" type="email" placeholder="Email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coll-pass">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="coll-pass" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Collector Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>System administrator access only.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAdminLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="admin-email" type="email" placeholder="Email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="admin-password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Admin Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center space-y-2">
          <Dialog open={isForgotOpen} onOpenChange={(val) => {
            setIsForgotOpen(val);
            if (!val) setStep(1);
          }}>
            <DialogTrigger asChild>
              <Button variant="link" size="sm" className="text-muted-foreground">
                <KeyRound className="h-3 w-3 mr-2" /> Forgot Password / Reset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  {step === 1 ? "Enter email to receive OTP." : "Enter OTP and new password."}
                </DialogDescription>
              </DialogHeader>
              {step === 1 ? (
                <form onSubmit={handleRequestOTP} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input id="forgot-email" type="email" placeholder="name@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isForgotLoading}>
                      {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Request OTP
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">6-Digit OTP</Label>
                    <Input id="otp" placeholder="XXXXXX" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isForgotLoading}>
                      {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reset Password
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-center">
          <Button variant="link" size="sm" className="text-muted-foreground text-[10px]" onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}>
            Trouble logging in? Reset Session
          </Button>
        </div>
      </div>
    </div>
  );
}

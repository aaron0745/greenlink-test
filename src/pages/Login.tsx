import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Loader2, Phone, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      if (error.message.includes("prohibited when a session is active")) {
        await useAuth().logout(); // Clear the ghost session
        toast({ title: "Session Cleared", description: "Please try logging in again." });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: error.message 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHouseholdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login('household', phone);
      toast({ title: "Welcome", description: "Household data loaded." });
      navigate("/dashboard"); // We'll handle redirection/view change in Dashboard
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
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

          {/* Household Login */}
          <TabsContent value="household">
            <Card>
              <CardHeader>
                <CardTitle>Household Login</CardTitle>
                <CardDescription>Enter your registered phone number to view records.</CardDescription>
              </CardHeader>
              <form onSubmit={handleHouseholdLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="house-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="house-phone" 
                        placeholder="98470XXXXX" 
                        className="pl-9" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
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

          {/* Collector Login */}
          <TabsContent value="collector">
            <Card>
              <CardHeader>
                <CardTitle>Collector Login</CardTitle>
                <CardDescription>Enter your official credentials to access your route.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAdminLogin /* Reuse handleAdminLogin logic but for collector role */}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coll-email">Official Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="coll-email" 
                        type="email"
                        placeholder="collector@panchayat.in" 
                        className="pl-9" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coll-pass">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="coll-pass" 
                        type="password"
                        className="pl-9" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button className="w-full" type="button" onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await login('collector', email, password);
                        toast({ title: "Welcome, Collector", description: "Route data loaded." });
                        navigate("/collector");
                      } catch (err: any) {
                        if (err.message.includes("prohibited when a session is active")) {
                           toast({ title: "Session Conflict", description: "Logging out previous session..." });
                           // We don't call logout here to avoid hook complexity, user can use the footer button
                        }
                        toast({ variant: "destructive", title: "Login Failed", description: err.message });
                      } finally {
                        setIsSubmitting(false);
                      }
                  }} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Collector Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>System administrator access only.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAdminLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="admin@panchayat.gov.in" 
                        className="pl-9" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        className="pl-9" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
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

        <p className="text-center text-xs text-muted-foreground">
          Kerala State Waste Management Project Initiative
        </p>
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

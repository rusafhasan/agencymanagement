import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, Database, User, Settings, Loader2, AlertCircle } from "lucide-react";

const INSTALL_API = "/install/index.php";

interface FormData {
  host: string;
  name: string;
  user: string;
  pass: string;
  adminEmail: string;
  adminName: string;
  adminPass: string;
  adminPassConfirm: string;
}

const Install = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    host: "localhost",
    name: "",
    user: "",
    pass: "",
    adminEmail: "",
    adminName: "",
    adminPass: "",
    adminPassConfirm: "",
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "host" || field === "name" || field === "user" || field === "pass") {
      setConnectionTested(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${INSTALL_API}?action=test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.host,
          name: formData.name,
          user: formData.user,
          pass: formData.pass,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setConnectionTested(true);
        toast.success("Database connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setLoading(false);
    }
  };

  const runInstallation = async () => {
    if (formData.adminPass !== formData.adminPassConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.adminPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${INSTALL_API}?action=install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.host,
          name: formData.name,
          user: formData.user,
          pass: formData.pass,
          adminEmail: formData.adminEmail,
          adminName: formData.adminName,
          adminPass: formData.adminPass,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setStep(4);
        toast.success("Installation completed!");
      } else {
        toast.error(result.error || "Installation failed");
      }
    } catch (error) {
      toast.error("Installation failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Welcome", icon: Settings },
    { number: 2, title: "Database", icon: Database },
    { number: 3, title: "Admin User", icon: User },
    { number: 4, title: "Complete", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step >= s.number 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}>
                <s.icon className="w-5 h-5" />
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 ${
                  step > s.number ? "bg-primary" : "bg-muted-foreground/30"
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/50 shadow-xl">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome to Agency Dashboard</CardTitle>
                <CardDescription>
                  This wizard will help you set up your application in just a few steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold">Before you begin, make sure you have:</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>MySQL database credentials (host, username, password)</li>
                    <li>A database name (will be created if it doesn't exist)</li>
                    <li>An email address for the admin account</li>
                  </ul>
                </div>
                <Button onClick={() => setStep(2)} className="w-full">
                  Start Installation
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2: Database Configuration */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>
                  Enter your MySQL database credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="host">Database Host</Label>
                    <Input
                      id="host"
                      value={formData.host}
                      onChange={(e) => updateField("host", e.target.value)}
                      placeholder="localhost"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Database Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="agency_dashboard"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user">Database Username</Label>
                    <Input
                      id="user"
                      value={formData.user}
                      onChange={(e) => updateField("user", e.target.value)}
                      placeholder="root"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pass">Database Password</Label>
                    <Input
                      id="pass"
                      type="password"
                      value={formData.pass}
                      onChange={(e) => updateField("pass", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {connectionTested && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    Connection successful!
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={testConnection} 
                    disabled={loading || !formData.name || !formData.user}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Test Connection
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!connectionTested}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Admin User */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Create Admin Account</CardTitle>
                <CardDescription>
                  Set up the administrator account for your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="adminName">Full Name</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => updateField("adminName", e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminEmail">Email Address</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => updateField("adminEmail", e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminPass">Password</Label>
                    <Input
                      id="adminPass"
                      type="password"
                      value={formData.adminPass}
                      onChange={(e) => updateField("adminPass", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminPassConfirm">Confirm Password</Label>
                    <Input
                      id="adminPassConfirm"
                      type="password"
                      value={formData.adminPassConfirm}
                      onChange={(e) => updateField("adminPassConfirm", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {formData.adminPass && formData.adminPass.length < 8 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Password must be at least 8 characters
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={runInstallation} 
                    disabled={loading || !formData.adminEmail || !formData.adminName || !formData.adminPass || formData.adminPass.length < 8}
                    className="flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Install Now
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Installation Complete!</CardTitle>
                <CardDescription>
                  Your Agency Dashboard is ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold">What's next?</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Log in with your admin credentials</li>
                    <li>Create employee and client accounts</li>
                    <li>Set up your first workspace and project</li>
                  </ul>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Security Note:</strong> For production use, delete the <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">/install</code> folder after installation.
                  </p>
                </div>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Go to Login
                </Button>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Agency Dashboard v1.0 • Need help? Check the documentation
        </p>
      </div>
    </div>
  );
};

export default Install;

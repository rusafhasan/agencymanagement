import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, FolderOpen, FileText, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Client Portal</h1>
              <p className="text-xs text-muted-foreground">Your project hub</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Client Portal</h2>
          <p className="text-muted-foreground">
            Track your projects and communicate with our team.
          </p>
        </div>

        {/* Quick Access */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Connect backend to see projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Connect backend to see files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Support</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Connect backend for support
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Welcome to Your Portal</CardTitle>
            <CardDescription>
              This is your client portal. When connected to a backend, you'll be able to:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>View your active projects and their status</li>
              <li>Access shared documents and deliverables</li>
              <li>Submit support requests</li>
              <li>Communicate directly with your assigned team</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

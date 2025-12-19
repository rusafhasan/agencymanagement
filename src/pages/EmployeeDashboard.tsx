import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, UserCircle, FolderKanban, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <UserCircle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Employee Dashboard</h1>
              <p className="text-xs text-muted-foreground">Your workspace</p>
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
          <h2 className="text-3xl font-bold tracking-tight">My Workspace</h2>
          <p className="text-muted-foreground">
            View your tasks, schedule, and messages.
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access your assigned projects and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/workspaces')} className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Open My Projects
            </Button>
            <Button onClick={() => navigate('/payments')} variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              View My Payments
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

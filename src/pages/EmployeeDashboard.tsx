import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, DollarSign, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <AppHeader 
        title="Employee Dashboard" 
        subtitle="Your workspace"
        icon={<UserCircle className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        <div className="mb-8 animate-fade-in">
          <h2 className="section-heading">My Workspace</h2>
          <p className="section-subheading">
            View your tasks, schedule, and messages.
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
            <CardDescription>Access your assigned projects and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/workspaces')} className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
                <FolderKanban className="h-4 w-4" />
                Open My Projects
              </Button>
              <Button onClick={() => navigate('/payments')} variant="outline" className="gap-2">
                <DollarSign className="h-4 w-4" />
                View My Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <AppHeader 
        title="Client Portal" 
        subtitle="Your project hub"
        icon={<User className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        <div className="mb-8 animate-fade-in">
          <h2 className="section-heading">Client Portal</h2>
          <p className="section-subheading">
            Track your projects and communicate with our team.
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="font-display">Your Workspace</CardTitle>
            <CardDescription>View your projects and track progress (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/workspaces')} className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
              <FolderKanban className="h-4 w-4" />
              View My Projects
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

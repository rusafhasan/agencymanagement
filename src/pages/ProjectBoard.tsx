import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement } from '@/contexts/ProjectManagementContext';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Kanban } from 'lucide-react';

export default function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, workspaces, canAccessProject } = useProjectManagement();

  const project = projects.find(p => p.id === projectId);
  const workspace = project ? workspaces.find(w => w.id === project.workspaceId) : null;

  if (!project || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Project not found</p>
      </div>
    );
  }

  if (!canAccessProject(project.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You don't have access to this project</p>
      </div>
    );
  }

  const isReadOnly = user?.role === 'client';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/workspaces/${workspace.id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Kanban className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{workspace.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <span className="text-xs bg-muted px-2 py-1 rounded">Read-only</span>
            )}
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="container mx-auto p-6">
        <KanbanBoard projectId={project.id} readOnly={isReadOnly} />
      </main>
    </div>
  );
}

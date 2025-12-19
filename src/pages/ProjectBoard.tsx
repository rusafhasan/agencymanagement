import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement } from '@/contexts/ProjectManagementContext';
import AppHeader from '@/components/layout/AppHeader';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Badge } from '@/components/ui/badge';
import { Kanban } from 'lucide-react';

export default function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, workspaces, canAccessProject } = useProjectManagement();

  const project = projects.find(p => p.id === projectId);
  const workspace = project ? workspaces.find(w => w.id === project.workspaceId) : null;

  if (!project || !workspace) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  if (!canAccessProject(project.id)) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-muted-foreground">You don't have access to this project</p>
      </div>
    );
  }

  const isReadOnly = user?.role === 'client';

  return (
    <div className="page-container">
      <AppHeader 
        title={project.name}
        subtitle={workspace.name}
        icon={<Kanban className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h2 className="section-heading">{project.name}</h2>
            <p className="section-subheading">{project.description || 'Kanban board for this project'}</p>
          </div>
          {isReadOnly && (
            <Badge variant="secondary" className="text-xs">
              View Only • Comments Enabled
            </Badge>
          )}
        </div>
        
        <KanbanBoard projectId={project.id} readOnly={isReadOnly} />
      </main>
    </div>
  );
}

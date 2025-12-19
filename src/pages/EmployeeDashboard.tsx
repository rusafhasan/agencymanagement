import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement, Task, TaskStatus } from '@/contexts/ProjectManagementContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FolderKanban, 
  UserCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  Calendar,
  DollarSign,
  ArrowRight,
  ListTodo,
  TrendingUp,
  GripVertical,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday, isThisMonth, isThisWeek, formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string; bgClass: string }> = {
  'not-started': { label: 'Not Started', className: 'bg-muted text-muted-foreground', bgClass: 'bg-muted/50' },
  'in-progress': { label: 'In Progress', className: 'bg-primary/10 text-primary', bgClass: 'bg-primary/5' },
  'needs-review': { label: 'Needs Review', className: 'bg-warning/10 text-warning', bgClass: 'bg-warning/5' },
  'completed': { label: 'Completed', className: 'bg-success/10 text-success', bgClass: 'bg-success/5' },
};

const STATUS_ORDER: TaskStatus[] = ['not-started', 'in-progress', 'needs-review', 'completed'];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    getWorkspacesForUser, 
    getProjectsForWorkspace, 
    getTasksForProject,
    tasks,
    projects,
    comments,
    moveTask,
    getPaymentsForUser
  } = useProjectManagement();

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const employeeWorkspaces = getWorkspacesForUser();
  const payments = getPaymentsForUser();

  // Get all projects and tasks for this employee
  const employeeData = useMemo(() => {
    const allProjects: Array<{
      project: typeof projects[0];
      workspace: typeof employeeWorkspaces[0];
      tasks: Task[];
      myTasks: Task[];
      completedTasks: number;
      totalTasks: number;
      progress: number;
      hasOverdue: boolean;
    }> = [];

    let myTasks: Task[] = [];
    let allTaskIds: string[] = [];

    employeeWorkspaces.forEach(workspace => {
      const workspaceProjects = getProjectsForWorkspace(workspace.id);
      workspaceProjects.forEach(project => {
        const projectTasks = getTasksForProject(project.id);
        const employeeTasks = projectTasks.filter(t => t.assignedTo === user?.id);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const overdueTasks = employeeTasks.filter(t => 
          t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed'
        );

        allProjects.push({
          project,
          workspace,
          tasks: projectTasks,
          myTasks: employeeTasks,
          completedTasks,
          totalTasks,
          progress,
          hasOverdue: overdueTasks.length > 0,
        });

        myTasks = [...myTasks, ...employeeTasks];
        allTaskIds = [...allTaskIds, ...projectTasks.map(t => t.id)];
      });
    });

    // Calculate stats
    const completedThisWeek = myTasks.filter(t => 
      t.status === 'completed' && isThisWeek(new Date(t.createdAt))
    ).length;

    const completedThisMonth = myTasks.filter(t => 
      t.status === 'completed' && isThisMonth(new Date(t.createdAt))
    ).length;

    const inProgressTasks = myTasks.filter(t => t.status === 'in-progress').length;

    const overdueTasks = myTasks.filter(t => 
      t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed'
    ).length;

    // Payment stats
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + p.amount, 0);

    // Get recent comments for employee's tasks
    const recentComments = comments
      .filter(c => allTaskIds.includes(c.taskId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);

    return {
      projects: allProjects,
      myTasks,
      stats: {
        completedThisWeek,
        completedThisMonth,
        inProgressTasks,
        overdueTasks,
        totalAssigned: myTasks.length,
      },
      paymentStats: {
        totalPaid,
        totalPending,
        totalPayments: payments.length,
      },
      recentComments,
    };
  }, [employeeWorkspaces, getProjectsForWorkspace, getTasksForProject, comments, payments, user?.id]);

  // Group tasks by status for the kanban-style view
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      'not-started': [],
      'in-progress': [],
      'needs-review': [],
      'completed': [],
    };
    
    employeeData.myTasks.forEach(task => {
      grouped[task.status].push(task);
    });

    // Sort by due date within each status
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return a.dueDate ? -1 : 1;
      });
    });

    return grouped;
  }, [employeeData.myTasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    const tasksInColumn = tasksByStatus[newStatus];
    const newOrder = tasksInColumn.length > 0 
      ? Math.max(...tasksInColumn.map(t => t.order)) + 1 
      : 1;

    moveTask(draggedTask.id, newStatus, newOrder);
    setDraggedTask(null);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getProjectForTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    return projects.find(p => p.id === task.projectId);
  };

  return (
    <div className="page-container">
      <AppHeader 
        title="Employee Dashboard" 
        subtitle="Your workspace"
        icon={<UserCircle className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="section-heading">Good day, {user?.name}</h2>
          <p className="section-subheading">
            Here's your work overview and assigned tasks.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="card-premium hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{employeeData.stats.totalAssigned}</div>
              <p className="text-xs text-muted-foreground mt-1">Total tasks</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-primary" style={{ animationDelay: '0.15s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-primary">{employeeData.stats.inProgressTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Active now</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-success" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-success">{employeeData.stats.completedThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-accent-foreground" style={{ animationDelay: '0.25s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-foreground" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{employeeData.stats.completedThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className={`card-premium hover-lift animate-fade-in border-l-4 ${employeeData.stats.overdueTasks > 0 ? 'border-l-destructive' : 'border-l-muted'}`} style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${employeeData.stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold font-display ${employeeData.stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {employeeData.stats.overdueTasks}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Overview */}
        <Card className="card-premium mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Overview
                </CardTitle>
                <CardDescription>Your earnings summary</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/payments')} className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{employeeData.paymentStats.totalPayments}</p>
                  <p className="text-xs text-muted-foreground">Total Payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-success">${employeeData.paymentStats.totalPaid.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Received</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-warning">${employeeData.paymentStats.totalPending.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Tasks - Kanban Style */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">My Tasks</h3>
            <p className="text-sm text-muted-foreground">Drag tasks between columns to update status</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STATUS_ORDER.map((status, colIndex) => {
              const config = STATUS_CONFIG[status];
              const statusTasks = tasksByStatus[status];
              
              return (
                <div
                  key={status}
                  className={`rounded-lg border p-3 min-h-[300px] ${config.bgClass} animate-fade-in`}
                  style={{ animationDelay: `${0.4 + colIndex * 0.05}s` }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">{config.label}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2 pr-2">
                      {statusTasks.map((task) => {
                        const project = getProjectForTask(task.id);
                        const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'completed';
                        
                        return (
                          <Card
                            key={task.id}
                            className={`card-premium cursor-grab active:cursor-grabbing hover-lift ${draggedTask?.id === task.id ? 'opacity-50 rotate-1' : ''} ${isOverdue ? 'border-destructive/50' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            onClick={() => project && navigate(`/projects/${project.id}`)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{task.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{project?.name}</p>
                                  {task.dueDate && (
                                    <div className={`flex items-center gap-1 mt-1.5 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(task.dueDate), 'MMM d')}
                                      {isOverdue && <AlertTriangle className="h-3 w-3 ml-1" />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {statusTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No tasks
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">My Projects</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/workspaces')} className="gap-1 text-muted-foreground">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {employeeData.projects.length === 0 ? (
              <Card className="card-premium animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No projects assigned yet.</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {employeeData.projects.map((item, i) => (
                    <Card 
                      key={item.project.id} 
                      className={`card-premium hover-lift cursor-pointer animate-fade-in ${item.hasOverdue ? 'border-destructive/50' : ''}`}
                      style={{ animationDelay: `${0.6 + i * 0.05}s` }}
                      onClick={() => navigate(`/projects/${item.project.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{item.project.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.workspace.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {item.myTasks.length} assigned
                            </Badge>
                            {item.hasOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Team Progress</span>
                            <span className="font-medium">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {item.completedTasks} of {item.totalTasks} tasks completed
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Recent Comments */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Updates
            </h3>
            
            <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.65s' }}>
              <CardContent className="pt-4">
                {employeeData.recentComments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent comments.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employeeData.recentComments.map((comment, i) => {
                      const task = tasks.find(t => t.id === comment.taskId);
                      const project = task ? projects.find(p => p.id === task.projectId) : null;
                      
                      return (
                        <div key={comment.id}>
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(comment.authorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{comment.authorName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{comment.content}</p>
                              {task && project && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  on <span className="font-medium text-foreground">{task.title}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          {i < employeeData.recentComments.length - 1 && <Separator className="mt-4" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

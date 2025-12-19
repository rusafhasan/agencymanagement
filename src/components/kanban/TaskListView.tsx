import { Task, TaskStatus } from '@/contexts/ProjectManagementContext';
import { User } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskListViewProps {
  tasks: Task[];
  employees: User[];
  onTaskClick: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  draggedTaskId?: string | null;
  readOnly?: boolean;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
  'not-started': { label: 'Not Started', variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  'in-progress': { label: 'In Progress', variant: 'default', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  'needs-review': { label: 'Needs Review', variant: 'outline', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  'completed': { label: 'Completed', variant: 'default', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
};

export default function TaskListView({ 
  tasks, 
  employees, 
  onTaskClick, 
  onDragStart, 
  draggedTaskId,
  readOnly = false 
}: TaskListViewProps) {
  const getAssigneeName = (assignedTo: string | null) => {
    if (!assignedTo) return null;
    const employee = employees.find(e => e.id === assignedTo);
    return employee?.name || 'Unassigned';
  };

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    return { date, isOverdue, isToday: isToday(date) };
  };

  // Sort tasks: overdue first, then by status, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder: Record<TaskStatus, number> = {
      'in-progress': 0,
      'needs-review': 1,
      'not-started': 2,
      'completed': 3,
    };
    
    // Overdue tasks first (if not completed)
    const aOverdue = a.dueDate && a.status !== 'completed' && isPast(new Date(a.dueDate));
    const bOverdue = b.dueDate && b.status !== 'completed' && isPast(new Date(b.dueDate));
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Then by status
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    
    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p>No tasks yet. Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
        <div className="col-span-6">Task</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2">Due Date</div>
      </div>

      {/* Task Rows */}
      <div className="space-y-1">
        {sortedTasks.map((task) => {
          const statusConfig = STATUS_CONFIG[task.status];
          const assigneeName = getAssigneeName(task.assignedTo);
          const dueDateInfo = getDueDateInfo(task.dueDate);
          const isDragging = draggedTaskId === task.id;

          return (
            <div
              key={task.id}
              draggable={!readOnly}
              onDragStart={(e) => onDragStart?.(e, task)}
              onClick={() => onTaskClick(task)}
              className={`
                grid grid-cols-12 gap-4 px-4 py-3 rounded-lg border bg-card 
                hover:bg-accent/50 cursor-pointer transition-all duration-200
                ${isDragging ? 'opacity-50 scale-[0.98]' : ''}
                ${task.status === 'completed' ? 'opacity-70' : ''}
              `}
            >
              {/* Task Title */}
              <div className="col-span-6 flex items-center gap-3">
                {!readOnly && (
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="col-span-2 flex items-center">
                <Badge variant="outline" className={`text-xs ${statusConfig.className}`}>
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Assignee */}
              <div className="col-span-2 flex items-center">
                {assigneeName ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(assigneeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>

              {/* Due Date */}
              <div className="col-span-2 flex items-center">
                {dueDateInfo ? (
                  <div className={`flex items-center gap-1.5 text-sm ${
                    dueDateInfo.isOverdue && task.status !== 'completed'
                      ? 'text-destructive font-medium' 
                      : dueDateInfo.isToday 
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-muted-foreground'
                  }`}>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {dueDateInfo.isToday 
                        ? 'Today' 
                        : format(dueDateInfo.date, 'MMM d')}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No date</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

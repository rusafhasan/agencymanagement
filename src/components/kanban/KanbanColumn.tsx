import { Task, TaskStatus } from '@/contexts/ProjectManagementContext';
import TaskCard from './TaskCard';
import { User } from '@/contexts/AuthContext';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  employees: User[];
  onTaskClick: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  draggedTaskId: string | null;
}

const statusColors: Record<TaskStatus, string> = {
  'not-started': 'bg-muted/50 border-muted-foreground/10',
  'in-progress': 'bg-primary/5 border-primary/20',
  'needs-review': 'bg-warning/5 border-warning/20',
  'completed': 'bg-success/5 border-success/20',
};

const statusDotColors: Record<TaskStatus, string> = {
  'not-started': 'bg-muted-foreground',
  'in-progress': 'bg-primary',
  'needs-review': 'bg-warning',
  'completed': 'bg-success',
};

export default function KanbanColumn({
  title,
  status,
  tasks,
  employees,
  onTaskClick,
  onDragStart,
  onDragOver,
  onDrop,
  draggedTaskId,
}: KanbanColumnProps) {
  const getAssigneeName = (assignedTo: string | null) => {
    if (!assignedTo) return undefined;
    const employee = employees.find(e => e.id === assignedTo);
    return employee?.name;
  };

  return (
    <div
      className={`flex flex-col rounded-xl border-2 p-4 min-h-[450px] transition-colors ${statusColors[status]}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${statusDotColors[status]}`} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2.5 py-1 rounded-full border">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            assigneeName={getAssigneeName(task.assignedTo)}
            onClick={() => onTaskClick(task)}
            onDragStart={(e) => onDragStart(e, task)}
            isDragging={draggedTaskId === task.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/60">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

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
  'not-started': 'bg-muted',
  'in-progress': 'bg-blue-500/10 border-blue-500/30',
  'needs-review': 'bg-yellow-500/10 border-yellow-500/30',
  'completed': 'bg-green-500/10 border-green-500/30',
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
      className={`flex flex-col rounded-lg border p-3 min-h-[400px] ${statusColors[status]}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
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
      </div>
    </div>
  );
}

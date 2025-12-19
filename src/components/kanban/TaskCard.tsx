import { Task } from '@/contexts/ProjectManagementContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, assigneeName, onClick, onDragStart, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isDragging ? 'opacity-50 rotate-2' : ''} ${isOverdue ? 'border-destructive bg-destructive/5' : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm leading-tight">{task.title}</p>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {task.dueDate && (
            <Badge 
              variant={isOverdue ? 'destructive' : isDueToday ? 'default' : 'secondary'}
              className="text-xs flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM d')}
              {isOverdue && ' (Overdue)'}
            </Badge>
          )}
          
          {assigneeName && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" />
              {assigneeName}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

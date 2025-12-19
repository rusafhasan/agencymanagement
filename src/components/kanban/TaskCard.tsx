import { Task } from '@/contexts/ProjectManagementContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MessageSquare } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  commentCount?: number;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, assigneeName, commentCount, onClick, onDragStart, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card
      className={`card-premium cursor-pointer transition-all duration-200 hover:shadow-premium-md active:scale-[0.98] ${isDragging ? 'opacity-50 rotate-1 scale-105' : ''} ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <CardContent className="p-3.5 space-y-2.5">
        <p className="font-medium text-sm leading-snug">{task.title}</p>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 items-center pt-1">
          {task.dueDate && (
            <Badge 
              variant={isOverdue ? 'destructive' : isDueToday ? 'default' : 'secondary'}
              className="text-xs flex items-center gap-1 font-normal"
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM d')}
              {isOverdue && ' (Overdue)'}
            </Badge>
          )}
          
          {assigneeName && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 font-normal">
              <User className="h-3 w-3" />
              {assigneeName}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

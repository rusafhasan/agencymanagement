import { useState } from 'react';
import { Task, TaskStatus, useProjectManagement } from '@/contexts/ProjectManagementContext';
import { useAuth } from '@/contexts/AuthContext';
import KanbanColumn from './KanbanColumn';
import TaskDetailModal from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  projectId: string;
  readOnly?: boolean;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'not-started', title: 'Not Started' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'needs-review', title: 'Needs Review' },
  { status: 'completed', title: 'Completed' },
];

export default function KanbanBoard({ projectId, readOnly = false }: KanbanBoardProps) {
  const { user } = useAuth();
  const { getTasksForProject, createTask, moveTask, getCommentsForTask, getEmployees } = useProjectManagement();
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const tasks = getTasksForProject(projectId);
  const employees = getEmployees();

  const canCreateTask = user?.role === 'admin';

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter(t => t.status === status);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask || readOnly) return;

    const tasksInColumn = getTasksByStatus(newStatus);
    const newOrder = tasksInColumn.length > 0 
      ? Math.max(...tasksInColumn.map(t => t.order)) + 1 
      : 1;

    moveTask(draggedTask.id, newStatus, newOrder);
    setDraggedTask(null);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      createTask(projectId, newTaskTitle.trim(), '');
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      {canCreateTask && !readOnly && (
        <div className="flex gap-2">
          {isAddingTask ? (
            <>
              <Input
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                autoFocus
              />
              <Button onClick={handleAddTask}>Add</Button>
              <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancel</Button>
            </>
          ) : (
            <Button onClick={() => setIsAddingTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={getTasksByStatus(column.status)}
            employees={employees}
            onTaskClick={setSelectedTask}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedTaskId={draggedTask?.id || null}
          />
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          comments={getCommentsForTask(selectedTask.id)}
          employees={employees}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

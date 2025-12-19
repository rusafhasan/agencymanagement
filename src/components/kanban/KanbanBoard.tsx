import { useState, useEffect } from 'react';
import { Task, TaskStatus, useProjectManagement } from '@/contexts/ProjectManagementContext';
import { useAuth, User } from '@/contexts/AuthContext';
import KanbanColumn from './KanbanColumn';
import TaskDetailModal from './TaskDetailModal';
import TaskListView from './TaskListView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, X, LayoutGrid, List } from 'lucide-react';

interface KanbanBoardProps {
  projectId: string;
  readOnly?: boolean;
}

type ViewMode = 'board' | 'list';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'not-started', title: 'Not Started' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'needs-review', title: 'Needs Review' },
  { status: 'completed', title: 'Completed' },
];

export default function KanbanBoard({ projectId, readOnly = false }: KanbanBoardProps) {
  const { user } = useAuth();
  const { getTasksForProject, createTask, moveTask, getCommentsForTask, getEmployees } = useProjectManagement();
  
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);

  const tasks = getTasksForProject(projectId);

  useEffect(() => {
    const loadEmployees = async () => {
      const fetchedEmployees = await getEmployees();
      setEmployees(fetchedEmployees);
    };
    loadEmployees();
  }, [getEmployees]);

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

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask || readOnly) return;

    const tasksInColumn = getTasksByStatus(newStatus);
    const newOrder = tasksInColumn.length > 0 
      ? Math.max(...tasksInColumn.map(t => t.order)) + 1 
      : 1;

    await moveTask(draggedTask.id, newStatus, newOrder);
    setDraggedTask(null);
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      await createTask(projectId, newTaskTitle.trim(), '');
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  // Get fresh task data when modal opens
  const getSelectedTaskWithComments = () => {
    if (!selectedTask) return null;
    const freshTask = tasks.find(t => t.id === selectedTask.id);
    return freshTask || selectedTask;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        {/* Add Task Button */}
        {canCreateTask && !readOnly && (
          <div>
            {isAddingTask ? (
              <div className="flex gap-3 max-w-md">
                <Input
                  placeholder="Enter task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  Add Task
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setIsAddingTask(false); setNewTaskTitle(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsAddingTask(true)} className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>
        )}

        {/* View Mode Toggle */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="bg-muted/50 p-1 rounded-lg"
        >
          <ToggleGroupItem 
            value="board" 
            aria-label="Board view"
            className="gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Board</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="list" 
            aria-label="List view"
            className="gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {COLUMNS.map((column, i) => (
            <div key={column.status} className="animate-fade-in" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
              <KanbanColumn
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
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="animate-fade-in">
          <TaskListView
            tasks={tasks}
            employees={employees}
            onTaskClick={setSelectedTask}
            onDragStart={handleDragStart}
            draggedTaskId={draggedTask?.id}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={getSelectedTaskWithComments()!}
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

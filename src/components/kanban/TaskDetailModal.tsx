import { useState } from 'react';
import { Task, Comment, TaskStatus, useProjectManagement } from '@/contexts/ProjectManagementContext';
import { useAuth, User } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, MessageSquare, Trash2, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  comments: Comment[];
  employees: User[];
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'completed', label: 'Completed' },
];

export default function TaskDetailModal({
  task,
  comments,
  employees,
  isOpen,
  onClose,
  readOnly = false,
}: TaskDetailModalProps) {
  const { user } = useAuth();
  const { updateTask, deleteTask, createComment } = useProjectManagement();
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [newComment, setNewComment] = useState('');

  const canEdit = !readOnly && (user?.role === 'admin' || user?.role === 'employee');
  const canComment = user?.role === 'admin' || user?.role === 'employee';
  const canDelete = user?.role === 'admin';

  const handleSave = () => {
    updateTask(task.id, {
      title,
      description,
      status,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      createComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Task Details</span>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              {canEdit ? (
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              ) : (
                <p className="text-sm">{title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              {canEdit ? (
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{description || 'No description'}</p>
              )}
            </div>

            {/* Status and Assignee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {canEdit ? (
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))
                      }
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{STATUS_OPTIONS.find(s => s.value === status)?.label}</Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Assigned To</Label>
                {canEdit ? (
                  <Select value={assignedTo || "unassigned"} onValueChange={(v) => setAssignedTo(v === "unassigned" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1 text-sm">
                    <UserIcon className="h-4 w-4" />
                    {employees.find(e => e.id === assignedTo)?.name || 'Unassigned'}
                  </div>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              {canEdit ? (
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {dueDate ? format(new Date(dueDate), 'MMMM d, yyyy') : 'No due date'}
                </div>
              )}
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <Label>Comments ({comments.length})</Label>
              </div>

              {/* Existing comments */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment */}
              {canComment && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Post
                  </Button>
                </div>
              )}
              {!canComment && (
                <p className="text-xs text-muted-foreground italic">Clients can view comments but cannot post.</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {canEdit && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
